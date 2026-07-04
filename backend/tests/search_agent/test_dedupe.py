from search_agent.dedupe import dedupe_candidates, normalize_company_name
from search_agent.schemas import CandidateLead, ContactInfo, EmailContact, Evidence
from search_agent.utils import now_iso


def _candidate(name: str, domain: str | None, **kwargs) -> CandidateLead:
    now = now_iso()
    return CandidateLead(
        id=f"lead_{name.replace(' ', '_')}",
        mission_id="m1",
        name=name,
        domain=domain,
        website_url=f"https://{domain}" if domain else None,
        source_urls=[f"https://{domain}"] if domain else [],
        created_at=now,
        updated_at=now,
        **kwargs,
    )


def test_dedupe_by_domain_merges_sources_and_evidence():
    first = _candidate(
        "Rhône Plomberie",
        "rhoneplomberie.fr",
        evidence=[
            Evidence(
                source_url="https://rhoneplomberie.fr",
                snippet="Plombier à Lyon",
                evidence_type="industry_match",
            )
        ],
    )
    second = _candidate(
        "Rhone Plomberie SARL",
        "rhoneplomberie.fr",
        contact=ContactInfo(
            emails=[EmailContact(value="contact@rhoneplomberie.fr", type="generic")]
        ),
        evidence=[
            Evidence(
                source_url="https://annuaire.example/rhone",
                snippet="Fiche annuaire",
                evidence_type="other",
            )
        ],
    )
    second.source_urls.append("https://annuaire.example/rhone")

    unique, removed = dedupe_candidates([first, second])
    assert removed == 1
    assert len(unique) == 1
    merged = unique[0]
    assert "https://annuaire.example/rhone" in merged.source_urls
    assert len(merged.evidence) == 2
    assert merged.contact.emails[0].value == "contact@rhoneplomberie.fr"


def test_dedupe_by_similar_name_without_domain():
    first = _candidate("BTP Rhône Services", "btprhone.fr")
    second = _candidate("BTP Rhone Services SAS", None)
    unique, removed = dedupe_candidates([first, second])
    assert removed == 1
    assert len(unique) == 1


def test_different_domains_are_kept():
    unique, removed = dedupe_candidates(
        [_candidate("A", "a.fr"), _candidate("B", "b.fr")]
    )
    assert removed == 0
    assert len(unique) == 2


def test_normalize_company_name_strips_accents_and_suffixes():
    assert normalize_company_name("BTP Rhône Services SAS") == "btp rhone services"
    assert normalize_company_name("Rhône-Plomberie SARL") == "rhone plomberie"
