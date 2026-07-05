"""Deterministic helpers for mission naming, descriptions, and targeting defaults."""

from __future__ import annotations

import re
from typing import Any, Literal

from models.schemas.prospect_segments import ProspectSegment

MissionPriority = Literal["fast_wins", "high_value", "broad_coverage"]
MissionUrgency = Literal["low", "medium", "high"]

PRIORITY_URGENCY: dict[str, MissionUrgency] = {
	"fast_wins": "high",
	"high_value": "medium",
	"broad_coverage": "low",
}

PRIORITY_LABELS = {
	"fast_wins": "Fast wins",
	"high_value": "High value",
	"broad_coverage": "Broad coverage",
}

BUSINESS_SIZE_LABELS = {
	"solo": "Solo / 1–5 employees",
	"small": "Small / 6–20 employees",
	"medium": "Medium / 21–50 employees",
	"large": "Large / 50+ employees",
}

FRENCH_LOCATION_HINTS = (
	"france",
	"lyon",
	"paris",
	"marseille",
	"toulouse",
	"bordeaux",
	"lille",
	"nantes",
	"strasbourg",
	"french",
	"français",
	"francais",
)

DEFAULT_INDUSTRIES = [
	"plumber",
	"locksmith",
	"electrician",
	"dentist",
	"clinic",
	"garage",
	"restaurant",
	"construction",
]


def infer_language_from_location(location: str, profile_languages: list[str] | None = None) -> str:
	location_lower = location.lower()
	if any(hint in location_lower for hint in FRENCH_LOCATION_HINTS):
		return "fr"
	if profile_languages:
		return profile_languages[0]
	return "en"


def suggest_industries_from_profile(
	ideal_customers: list[str] | None = None,
	business_type: str | None = None,
) -> list[str]:
	suggestions: list[str] = []
	seen: set[str] = set()

	def add(value: str) -> None:
		key = value.lower()
		if key not in seen:
			seen.add(key)
			suggestions.append(value)

	for customer in ideal_customers or []:
		for industry in DEFAULT_INDUSTRIES:
			if industry in customer.lower():
				add(industry.capitalize())

	if business_type:
		for industry in DEFAULT_INDUSTRIES:
			if industry in business_type.lower():
				add(industry.capitalize())

	for industry in DEFAULT_INDUSTRIES:
		add(industry.capitalize())

	return suggestions[:8]


def suggest_prospect_segments_fallback(
	business_profile: dict[str, Any] | None = None,
) -> list[ProspectSegment]:
	"""Deterministic segments aligned with what the seller offers — not generic trades."""
	profile = business_profile or {}
	what = str(profile.get("whatWeSell") or profile.get("what_we_sell") or "").lower()
	ideal_text = " ".join(
		profile.get("idealCustomers") or profile.get("ideal_customers") or []
	).lower()
	value = str(
		profile.get("valueProposition") or profile.get("value_proposition") or ""
	).lower()
	product_text = f"{what} {value}"

	call_product = any(
		token in product_text
		for token in ("phone", "call", "reception", "receptionist", "inbound", "missed call")
	)

	if call_product:
		return [
			ProspectSegment(
				id="emergency-on-call",
				label="Emergency & on-call local services",
				target="emergency plumber locksmith HVAC",
				reason="They promise 24/7 response but miss inbound calls while teams are on jobs",
				trigger_signals=["24/7 service", "Emergency calls", "Phone-first booking"],
				buyer_roles=["Owner"],
			),
			ProspectSegment(
				id="appointment-front-desk",
				label="Appointment-based businesses with a front desk",
				target="dental clinic veterinary salon",
				reason="Staff serving clients can't answer the phone — calls go to voicemail",
				trigger_signals=["Online booking", "Reception desk", "High appointment volume"],
				buyer_roles=["Owner", "Office manager"],
			),
			ProspectSegment(
				id="field-service-teams",
				label="Field service teams (quotes & scheduling by phone)",
				target="home renovation roofing landscaping",
				reason="Owners are in the field; new customer calls compete with active work",
				trigger_signals=["Free quote", "Mobile team", "Call to schedule"],
				buyer_roles=["Owner"],
			),
			ProspectSegment(
				id="auto-garage-inbound",
				label="Auto repair & garages with high inbound volume",
				target="auto garage mechanic car repair",
				reason="Workshop noise and busy bays make live call handling unreliable",
				trigger_signals=["Breakdown service", "Same-day repair", "Phone estimates"],
				buyer_roles=["Owner", "Shop manager"],
			),
			ProspectSegment(
				id="property-maintenance",
				label="Property maintenance with after-hours demand",
				target="property maintenance facility management",
				reason="Tenants call outside business hours; small teams can't cover every line",
				trigger_signals=["After-hours", "Tenant support", "On-call maintenance"],
				buyer_roles=["Operations manager"],
			),
		]

	# Generic B2B fallback — derive from product description + ideal customers
	industries = suggest_industries_from_profile(
		profile.get("idealCustomers") or profile.get("ideal_customers"),
		profile.get("businessType") or profile.get("business_type"),
	)
	product_hint = what.strip()[:100] or "your offering"
	target_phrase = (
		" ".join(ind.lower() for ind in industries[:3])
		or " ".join(word for word in ideal_text.split()[:4])
		or "organizations matching your ICP"
	)
	return [
		ProspectSegment(
			id="profile-aligned",
			label="Organizations matching your ideal customer profile",
			target=target_phrase,
			reason=f"Prospects aligned with who you sell to and likely to need {product_hint}",
			trigger_signals=["Active online presence", "Growing team"],
			buyer_roles=["Owner", "Decision maker"],
		),
		ProspectSegment(
			id="product-fit",
			label="Buyers with pain your product solves",
			target=f"{target_phrase} {what.split()[0] if what else 'buyers'}".strip(),
			reason=f"Targets chosen for fit with what you sell: {product_hint}",
			trigger_signals=["Recent hiring", "Digital transformation", "Compliance needs"],
			buyer_roles=["Founder", "Operations manager"],
		),
		ProspectSegment(
			id="growth-segment",
			label="Growing teams expanding their stack",
			target=f"growing {target_phrase}",
			reason="Scaling organizations often adopt new tools that match your value proposition",
			trigger_signals=["Hiring", "New location", "Expanded services"],
			buyer_roles=["Founder", "Owner"],
		),
	]


def suggest_business_sizes() -> list[str]:
	return list(BUSINESS_SIZE_LABELS.keys())


def priority_to_urgency(priority: str | None) -> MissionUrgency | None:
	if not priority:
		return None
	return PRIORITY_URGENCY.get(priority)


def suggest_mission_name(
	*,
	target: str,
	location: str,
	priority: str | None = None,
	desired_lead_count: int | None = None,
) -> str:
	target_label = target.strip() or "prospects"
	location_label = _short_location(location)
	parts = [target_label.title()]

	if location_label:
		parts.append(f"in {location_label}")

	if priority and priority in PRIORITY_LABELS:
		parts.append(PRIORITY_LABELS[priority])

	if desired_lead_count:
		parts.append(f"{desired_lead_count} leads")

	name = " – ".join(parts)
	return name[:160]


def build_mission_description(
	*,
	name: str,
	target: str,
	location: str,
	business_size: str | None = None,
	priority: str | None = None,
	buyer_roles: list[str] | None = None,
	trigger_signals: list[str] | None = None,
	must_have_filters: list[str] | None = None,
	desired_lead_count: int | None = None,
) -> str:
	target_label = target.strip() or "prospects"
	location_label = location.strip() or "the target area"
	size_label = BUSINESS_SIZE_LABELS.get(business_size or "", business_size or "")

	lead_phrase = f"{desired_lead_count} " if desired_lead_count else ""
	opening = f"Find {lead_phrase}{size_label + ' ' if size_label else ''}{target_label} in {location_label}"

	qualifiers: list[str] = []
	if trigger_signals:
		qualifiers.append(f"showing signals like {', '.join(trigger_signals[:3])}")
	if buyer_roles:
		qualifiers.append(f"reaching {', '.join(buyer_roles[:2])}")
	if must_have_filters:
		qualifiers.append(f"with {', '.join(must_have_filters[:2])}")

	if priority == "fast_wins":
		qualifiers.append("prioritizing quick contactability")
	elif priority == "high_value":
		qualifiers.append("prioritizing best-fit accounts")
	elif priority == "broad_coverage":
		qualifiers.append("maximizing market coverage")

	description = opening
	if qualifiers:
		description += " " + ", ".join(qualifiers) + "."

	if not description.strip():
		return _default_description(name, target)
	return description[:500]


def build_mission_summary(
	*,
	target: str,
	location: str,
	business_size: str | None = None,
	desired_lead_count: int | None = None,
	trigger_signals: list[str] | None = None,
	must_have_filters: list[str] | None = None,
	priority: str | None = None,
) -> str:
	target_label = target.strip() or "businesses"
	location_label = location.strip() or "your target area"
	size_label = BUSINESS_SIZE_LABELS.get(business_size or "", "")

	count = desired_lead_count or 25
	parts = [f"Find {count}"]

	if size_label:
		parts.append(size_label.lower())
	parts.append(target_label)
	parts.append(f"in {location_label}")

	summary = " ".join(parts)

	context: list[str] = []
	if trigger_signals:
		context.append(f"likely to show {trigger_signals[0]}")
	if must_have_filters:
		context.append(f"prioritizing {must_have_filters[0]}")
	if priority == "fast_wins":
		context.append("optimized for fast wins")
	elif priority == "high_value":
		context.append("optimized for high-value fit")

	if context:
		summary += " " + ", ".join(context) + "."

	return summary


def estimate_yield(
	*,
	location: str,
	target: str,
	desired_lead_count: int | None = None,
	must_have_filters: list[str] | None = None,
	negative_filters: list[str] | None = None,
) -> tuple[int, int]:
	base = desired_lead_count or 25
	strictness = len(must_have_filters or []) + len(negative_filters or [])
	location_factor = 1.0 if location.strip() else 0.7
	target_factor = 0.85 if target.strip() else 0.6
	adjusted = int(base * location_factor * target_factor * max(0.5, 1 - strictness * 0.08))
	low = max(5, adjusted - max(3, adjusted // 4))
	high = adjusted + max(5, adjusted // 3)
	return low, high


def assess_difficulty(
	*,
	target: str,
	location: str,
	must_have_filters: list[str] | None = None,
	negative_filters: list[str] | None = None,
	trigger_signals: list[str] | None = None,
) -> Literal["easy", "moderate", "hard"]:
	score = 0
	if not target.strip():
		score += 1
	if not location.strip():
		score += 1
	score += len(must_have_filters or [])
	score += len(negative_filters or []) // 2
	score += len(trigger_signals or []) // 2

	if score <= 2:
		return "easy"
	if score <= 5:
		return "moderate"
	return "hard"


def coverage_warning(
	*,
	target: str,
	location: str,
	must_have_filters: list[str] | None = None,
	negative_filters: list[str] | None = None,
) -> str | None:
	strictness = len(must_have_filters or []) + len(negative_filters or [])
	if not target.strip() or not location.strip():
		return "Add a target type and location to improve result quality."
	if strictness >= 5:
		return "Your criteria may be too strict — consider relaxing a filter."
	if strictness == 0 and not target.strip():
		return "Your criteria may be too broad — add a target type to reduce noise."
	return None


def _short_location(location: str) -> str:
	location = location.strip()
	if not location:
		return ""
	return location.split(",")[0].strip()


def _default_description(name: str, target: str) -> str:
	name = name.strip()
	target = target.strip()
	if target and target.lower() not in name.lower():
		return f"{name}: {target}"
	return target or name
