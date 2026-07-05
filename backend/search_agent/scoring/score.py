"""Transparent, deterministic candidate scoring.

overallScore = 50% fit + 30% contactability + 20% evidence quality.
Every point awarded is mirrored by a human-readable reason string so the
Discover page can show *why* a lead ranks where it does.
"""

from dataclasses import dataclass, field

from ..schemas import CandidateLead, Mission, Scores, SearchPlan
from ..utils import normalize_text

# Text signals that suggest an active, phone-first local service business.
GOOD_SIGNAL_KEYWORDS = [
    "24h/24",
    "7j/7",
    "urgence",
    "depannage",
    "intervention rapide",
    "devis",
    "sur rendez-vous",
    "emergency",
    "same day",
    "free quote",
    "24/7",
]

# Text signals that suggest a bad fit for a small-local-business mission.
BAD_SIGNAL_KEYWORDS = [
    "grand groupe",
    "groupe national",
    "grands comptes",
    "appels d'offres",
    "multinational",
    "enterprise group",
    "national group",
    "fortune 500",
]


@dataclass
class ScoringContext:
    """Deterministic keyword sets derived from mission + plan."""

    location_terms: list[str] = field(default_factory=list)
    segment_terms: list[str] = field(default_factory=list)
    good_signal_terms: list[str] = field(default_factory=list)
    bad_signal_terms: list[str] = field(default_factory=list)


def build_scoring_context(mission: Mission, plan: SearchPlan) -> ScoringContext:
    location_terms = []
    if mission.target_location:
        location_terms.append(normalize_text(mission.target_location))
    segment_terms = [normalize_text(s) for s in plan.target_segments]
    if mission.target_industry:
        term = normalize_text(mission.target_industry)
        if term not in segment_terms:
            segment_terms.append(term)
    for signal in mission.trigger_signals or []:
        term = normalize_text(signal)
        if term and term not in segment_terms:
            segment_terms.append(term)
    # Also match individual significant words of multi-word segments
    # ("entreprise de rénovation" should match a page saying "rénovation").
    for segment in list(segment_terms):
        for word in segment.split():
            if len(word) >= 5 and word not in segment_terms:
                segment_terms.append(word)

    good_signal_terms = [
        normalize_text(s) for s in plan.good_fit_signals if normalize_text(s)
    ]
    for signal in mission.trigger_signals or []:
        term = normalize_text(signal)
        if term and term not in good_signal_terms:
            good_signal_terms.append(term)
    if not good_signal_terms:
        good_signal_terms = [normalize_text(k) for k in GOOD_SIGNAL_KEYWORDS]

    bad_signal_terms = [
        normalize_text(s) for s in plan.bad_fit_signals if normalize_text(s)
    ]
    for filt in mission.negative_filters or []:
        term = normalize_text(filt)
        if term and term not in bad_signal_terms:
            bad_signal_terms.append(term)
    if not bad_signal_terms:
        bad_signal_terms = [normalize_text(k) for k in BAD_SIGNAL_KEYWORDS]

    return ScoringContext(
        location_terms=location_terms,
        segment_terms=segment_terms,
        good_signal_terms=good_signal_terms,
        bad_signal_terms=bad_signal_terms,
    )


@dataclass
class ScoringResult:
    scores: Scores
    reasons: list[str]
    bad_signal_hits: list[str]
    has_contact: bool
    website_ok: bool


def _candidate_haystack(candidate: CandidateLead, page_text: str | None) -> str:
    parts = [candidate.name, candidate.short_description or "", page_text or ""]
    parts.extend(e.snippet for e in candidate.evidence)
    return normalize_text(" ".join(parts))


def score_candidate(
    candidate: CandidateLead,
    context: ScoringContext,
    page_text: str | None = None,
    website_ok: bool = False,
) -> ScoringResult:
    haystack = _candidate_haystack(candidate, page_text)
    reasons: list[str] = []

    # ---- fit score -------------------------------------------------------
    fit = 0.0

    location_hits = [t for t in context.location_terms if t and t in haystack]
    if location_hits:
        fit += 25
        reasons.append(f"Location match: {', '.join(location_hits)}")

    segment_hits = [t for t in context.segment_terms if t and t in haystack]
    if segment_hits:
        fit += 15 + min(len(segment_hits) - 1, 2) * 5  # 15 / 20 / 25
        reasons.append(f"Industry match: {', '.join(segment_hits[:3])}")

    good_hits = [t for t in context.good_signal_terms if t in haystack]
    if good_hits:
        fit += min(len(good_hits) * 7, 20)
        reasons.append(f"Activity signals: {', '.join(good_hits[:4])}")

    if website_ok:
        fit += 10
        reasons.append("Website is reachable and active")

    if len(candidate.evidence) >= 3:
        fit += 10
    elif len(candidate.evidence) >= 2:
        fit += 5

    bad_hits = [t for t in context.bad_signal_terms if t in haystack]
    if bad_hits:
        fit -= min(len(bad_hits) * 20, 40)
        reasons.append(f"Bad-fit signals: {', '.join(bad_hits[:3])}")

    fit = max(0.0, min(100.0, fit))

    # ---- contactability --------------------------------------------------
    contactability = 0.0
    if candidate.contact.emails:
        contactability += 35
        if any(e.type == "personal" for e in candidate.contact.emails):
            contactability += 5
            reasons.append("Personal email found")
        else:
            reasons.append("Email found")
    if candidate.contact.phones:
        contactability += 30
        reasons.append("Phone number found")
    if candidate.contact.contact_page_url:
        contactability += 15
        reasons.append("Contact page found")
    if candidate.contact.social_links:
        contactability += 10
    contactability = min(100.0, contactability)

    # ---- evidence quality ------------------------------------------------
    evidence_quality = 0.0
    if website_ok:
        evidence_quality += 30
    if any(e.snippet for e in candidate.evidence):
        evidence_quality += 20
    evidence_types = {e.evidence_type for e in candidate.evidence}
    if len(evidence_types) >= 3:
        evidence_quality += 25
    elif len(evidence_types) >= 2:
        evidence_quality += 15
    if len(set(candidate.source_urls)) >= 2:
        evidence_quality += 15
    evidence_quality = min(100.0, evidence_quality)

    overall = round(0.5 * fit + 0.3 * contactability + 0.2 * evidence_quality, 1)

    has_contact = bool(candidate.contact.emails or candidate.contact.phones)
    return ScoringResult(
        scores=Scores(
            fit_score=round(fit, 1),
            contactability_score=round(contactability, 1),
            evidence_quality_score=round(evidence_quality, 1),
            overall_score=overall,
        ),
        reasons=reasons,
        bad_signal_hits=bad_hits,
        has_contact=has_contact,
        website_ok=website_ok,
    )
