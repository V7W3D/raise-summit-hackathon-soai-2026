from search_agent.planning import build_fallback_plan
from search_agent.schemas import CandidateLead, ContactInfo, EmailContact, Evidence, PhoneContact
from search_agent.scoring import build_scoring_context, classify_candidate, score_candidate
from search_agent.utils import now_iso

from .fixtures import example_input


def _context():
    agent_input = example_input()
    plan = build_fallback_plan(agent_input)
    return agent_input.mission, build_scoring_context(agent_input.mission, plan)


def _candidate(name, description, contact=None, evidence=None):
    now = now_iso()
    return CandidateLead(
        id="lead_x",
        mission_id="m1",
        name=name,
        short_description=description,
        contact=contact or ContactInfo(),
        evidence=evidence or [],
        source_urls=["https://example.fr"],
        created_at=now,
        updated_at=now,
    )


def _evidence(kinds):
    return [
        Evidence(source_url="https://example.fr", snippet="snippet", evidence_type=k)
        for k in kinds
    ]


def test_strong_local_plumbing_lead_scores_high():
    mission, context = _context()
    candidate = _candidate(
        "Rhône Plomberie",
        "Plombier à Lyon. Intervention rapide 24h/24 et 7j/7, dépannage, devis gratuit.",
        contact=ContactInfo(
            emails=[EmailContact(value="contact@rhoneplomberie.fr", type="generic")],
            phones=[PhoneContact(value="04 78 12 34 56")],
        ),
        evidence=_evidence(
            ["industry_match", "location_match", "contact_found", "activity_signal"]
        ),
    )
    result = score_candidate(candidate, context, website_ok=True)
    assert result.scores.fit_score >= 70
    assert result.scores.overall_score >= 75
    classification = classify_candidate(candidate, result, mission)
    assert classification.category == "high_fit"
    assert classification.recommended_next_action == "draft_outreach"


def test_irrelevant_lead_scores_low():
    mission, context = _context()
    candidate = _candidate(
        "Paris Enterprise Construction Group",
        "Grand groupe national de construction, projets publics, appels d'offres grands comptes.",
        evidence=_evidence(["industry_match", "bad_fit_signal"]),
    )
    result = score_candidate(candidate, context, website_ok=True)
    assert result.scores.fit_score < 45
    classification = classify_candidate(candidate, result, mission)
    assert classification.category == "rejected_or_low_fit"
    assert classification.recommended_next_action == "reject"


def test_good_fit_without_contact_is_promising_but_incomplete():
    mission, context = _context()
    candidate = _candidate(
        "BTP Rhône Services",
        "Entreprise de rénovation et maintenance à Lyon. Travaux de bâtiment. Contact via formulaire.",
        evidence=_evidence(["industry_match", "location_match"]),
    )
    result = score_candidate(candidate, context, website_ok=True)
    assert not result.has_contact
    classification = classify_candidate(candidate, result, mission)
    assert classification.category == "promising_but_incomplete"
    assert "No email found" in classification.missing_info


def test_reasons_are_populated():
    mission, context = _context()
    candidate = _candidate(
        "Rhône Plomberie",
        "Plombier à Lyon, dépannage 24h/24, devis gratuit.",
        contact=ContactInfo(phones=[PhoneContact(value="04 78 12 34 56")]),
        evidence=_evidence(["industry_match", "location_match", "contact_found"]),
    )
    result = score_candidate(candidate, context, website_ok=True)
    reasons = " ".join(result.reasons).lower()
    assert "location" in reasons
    assert "phone" in reasons


def test_overall_score_is_weighted_average():
    mission, context = _context()
    candidate = _candidate(
        "Rhône Plomberie",
        "Plombier à Lyon",
        evidence=_evidence(["industry_match"]),
    )
    result = score_candidate(candidate, context, website_ok=False)
    scores = result.scores
    expected = round(
        0.5 * scores.fit_score
        + 0.3 * scores.contactability_score
        + 0.2 * scores.evidence_quality_score,
        1,
    )
    assert scores.overall_score == expected
