"""Priority-aware candidate classification."""

from ..schemas import CandidateLead, Classification, Mission
from .score import ScoringResult


def _thresholds(mission: Mission) -> tuple[int, int]:
	"""Return (overall_min, fit_min) for high_fit bucket."""
	priority = (mission.mission_priority or "").strip()
	if priority == "fast_wins":
		return 68, 55
	if priority == "high_value":
		return 80, 75
	if priority == "broad_coverage":
		return 70, 62
	return 75, 70


def classify_candidate(
    candidate: CandidateLead, result: ScoringResult, mission: Mission
) -> Classification:
    scores = result.scores
    overall, fit = scores.overall_score, scores.fit_score
    high_overall, high_fit = _thresholds(mission)
    priority = (mission.mission_priority or "").strip()

    if len(result.bad_signal_hits) >= 2 and fit < 50:
        category = "rejected_or_low_fit"
    elif (
        overall >= high_overall
        and fit >= high_fit
        and (priority != "fast_wins" or result.has_contact)
    ):
        category = "high_fit"
    elif fit >= 55 and not result.has_contact:
        category = "promising_but_incomplete"
    elif overall >= 60:
        category = "promising_but_incomplete"
    elif overall >= 45:
        category = "needs_verification"
    else:
        category = "rejected_or_low_fit"

    missing_info: list[str] = []
    if not candidate.contact.emails:
        missing_info.append("No email found")
    if not candidate.contact.phones:
        missing_info.append("No phone number found")
    if not result.has_contact and not candidate.contact.contact_page_url:
        missing_info.append("No contact channel found")
    if candidate.type == "company":
        missing_info.append("No named decision-maker found")
    if not candidate.location:
        missing_info.append("Location not confirmed")

    if category == "high_fit":
        action = "draft_outreach" if result.has_contact else "find_contact"
    elif category == "promising_but_incomplete":
        if mission.urgency == "low":
            action = "save_for_later"
        elif not result.has_contact and fit >= 65:
            action = "find_contact"
        else:
            action = "investigate_more"
    elif category == "needs_verification":
        action = "open_details" if candidate.evidence else "investigate_more"
    else:
        action = "reject"

    if overall >= 80 or overall <= 25:
        confidence = "high"
    elif scores.evidence_quality_score >= 60:
        confidence = "medium"
    else:
        confidence = "low"

    return Classification(
        category=category,
        confidence=confidence,
        reasons=result.reasons,
        missing_info=missing_info,
        recommended_next_action=action,
    )
