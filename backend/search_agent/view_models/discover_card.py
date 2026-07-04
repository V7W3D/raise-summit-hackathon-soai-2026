"""Adapter so the future Discover page can render leads without knowing
the agent's internals."""

from ..schemas import CandidateLead, DiscoverLeadCardVM

ACTION_LABELS = {
    "open_details": "Open details",
    "investigate_more": "Investigate more",
    "draft_outreach": "Draft outreach",
    "find_contact": "Find contact",
    "reject": "Reject",
    "save_for_later": "Save for later",
}


def to_discover_card(candidate: CandidateLead) -> DiscoverLeadCardVM:
    badges: list[str] = []
    if candidate.contact.emails:
        badges.append("Email found")
    if candidate.contact.phones:
        badges.append("Phone found")
    if candidate.contact.contact_page_url:
        badges.append("Contact page")
    if candidate.contact.social_links:
        badges.append("Social profiles")

    action = candidate.classification.recommended_next_action
    return DiscoverLeadCardVM(
        id=candidate.id,
        title=candidate.name,
        subtitle=candidate.short_description,
        location=candidate.location,
        domain=candidate.domain,
        contact_badges=badges,
        fit_score=candidate.scores.fit_score,
        category=candidate.classification.category,
        reasons=candidate.classification.reasons,
        missing_info=candidate.classification.missing_info,
        recommended_next_action=action,
        primary_action_label=ACTION_LABELS.get(action, "Open details"),
    )
