"""Groq-powered outreach drafting grounded in verified lead signals."""

from __future__ import annotations

import json
from typing import Any

from models.clients.business_profiles import BusinessProfile
from models.clients.leads import Lead
from models.clients.missions import Mission
from services.mission_llm import (
	MissionLLMError,
	_extract_json,
	_generate_with_llm,
	llm_available,
)

OUTREACH_ANGLES = ("missed_calls", "customer_service", "growth")

OUTREACH_SYSTEM_PROMPT = """You write short, high-converting B2B outreach for a seller contacting a small local business.

Hard rules:
- Ground every claim in the provided lead evidence and signals. Never invent facts.
- 60 to 110 words for email/LinkedIn body. Plain, human, consultative tone. No hype words (revolutionary, game-changer, guaranteed, act now).
- Lead with something specific about THEIR business (from evidence/signals), then one sentence on how the seller helps, then ONE low-friction call to action phrased as a question, written in the same language as the rest of the message.
- NEVER invent phone numbers, email addresses, names, prices, or statistics. Do not include any contact details in the message.
- Match the requested channel: email (subject + body), linkedin (short message, no subject), call (short call script with opening, value line, 2 qualify questions, close).
- Match the requested angle.
- Write in the mission language (fr = French, en = English). Default to the lead's likely language from their location.
- Relevance is good; creepy over-personalization is bad. Use at most 2 specific facts.

Return JSON only:
{
  "subject": "email subject or short title (empty string for linkedin)",
  "body": "the message or call script",
  "why_now": "one sentence: why reach out to this lead now, grounded in signals",
  "evidence_used": ["short fact 1 used in the draft", "short fact 2"],
  "followup_hint": "one sentence suggesting the next touch if no reply",
  "followup_plan": [
    {"day": 3, "channel": "email|call|linkedin", "goal": "bump", "message_idea": "one short line describing what to say"},
    {"day": 7, "channel": "email|call|linkedin", "goal": "new angle", "message_idea": "one short line"},
    {"day": 14, "channel": "email|call|linkedin", "goal": "close the loop", "message_idea": "one short line"}
  ]
}

followup_plan rules: exactly 3 touches if no reply, days counted from the first touch, vary the channel when the lead has both email and phone, each message_idea grounded in the same evidence (never new invented facts)."""


def _lead_payload(lead: Lead) -> dict[str, Any]:
	return {
		"name": lead.name,
		"description": lead.description,
		"location": lead.location,
		"website": lead.website,
		"hasEmail": bool(lead.email),
		"hasPhone": bool(lead.phone),
		"fitScore": lead.score,
		"whySignals": lead.why[:4],
		"evidence": [
			{"quote": item.get("quote", ""), "source": item.get("source", "")}
			for item in lead.evidence[:3]
		],
		"recommendedApproach": lead.recommended[:2],
	}


def _profile_payload(profile: BusinessProfile | None) -> dict[str, Any]:
	if profile is None:
		return {}
	return {
		"businessName": profile.business_name,
		"whatWeSell": profile.what_we_sell,
		"valueProposition": profile.value_proposition,
		"idealCustomers": profile.ideal_customers,
		"preferredTone": profile.preferred_tone,
	}


def _mission_payload(mission: Mission | None) -> dict[str, Any]:
	if mission is None:
		return {}
	return {
		"name": mission.name,
		"target": mission.target,
		"location": mission.location,
		"language": mission.language,
	}


def generate_outreach_draft(
	*,
	lead: Lead,
	channel: str,
	angle: str,
	mission: Mission | None = None,
	business_profile: BusinessProfile | None = None,
) -> dict[str, Any]:
	"""Generate a grounded outreach draft with Groq. Raises MissionLLMError on failure."""
	if not llm_available():
		raise MissionLLMError("GROQ_API_KEY is not configured")

	user_payload = {
		"channel": channel,
		"angle": angle,
		"lead": _lead_payload(lead),
		"seller": _profile_payload(business_profile),
		"mission": _mission_payload(mission),
	}
	raw = _generate_with_llm(
		user_prompt=json.dumps(user_payload, ensure_ascii=False),
		system_instruction=OUTREACH_SYSTEM_PROMPT,
	)
	parsed = _extract_json(raw)

	body = str(parsed.get("body") or "").strip()
	if not body:
		raise MissionLLMError("The LLM returned an empty draft")

	return {
		"subject": str(parsed.get("subject") or "").strip(),
		"body": body,
		"why_now": str(parsed.get("why_now") or "").strip(),
		"evidence_used": [
			str(item).strip()
			for item in (parsed.get("evidence_used") or [])
			if str(item).strip()
		][:3],
		"followup_hint": str(parsed.get("followup_hint") or "").strip(),
		"followup_plan": _clean_followup_plan(parsed.get("followup_plan")),
		"source": "llm",
	}


def _clean_followup_plan(raw: Any) -> list[dict[str, Any]]:
	if not isinstance(raw, list):
		return []
	plan: list[dict[str, Any]] = []
	for item in raw[:3]:
		if not isinstance(item, dict):
			continue
		channel = str(item.get("channel") or "email").strip().lower()
		if channel not in ("email", "call", "linkedin"):
			channel = "email"
		try:
			day = max(1, int(item.get("day") or 0))
		except (TypeError, ValueError):
			day = 3
		message_idea = str(item.get("message_idea") or "").strip()
		if not message_idea:
			continue
		plan.append(
			{
				"day": day,
				"channel": channel,
				"goal": str(item.get("goal") or "follow up").strip(),
				"message_idea": message_idea,
			}
		)
	return plan


def generate_fallback_draft(
	*,
	lead: Lead,
	channel: str,
	business_profile: BusinessProfile | None = None,
) -> dict[str, Any]:
	"""Deterministic draft when the LLM is unavailable."""
	city = lead.location.split(",")[0].strip() or lead.location.strip()
	signal = (lead.why[0].lower() if lead.why else lead.description.lower()) or "your local presence"
	offer = (
		business_profile.what_we_sell
		if business_profile
		else "AI call reception for local service businesses"
	)

	if channel == "call":
		body = "\n".join(
			[
				f'Opening: "Hi, I noticed {lead.name} — {signal}."',
				f'Value: "We help businesses like yours with {offer.lower()}."',
				"Qualify: How do you handle inbound calls when the team is busy?",
				"Close: Would a 10-minute call this week be worth it?",
			]
		)
		subject = f"Call script — {lead.name}"
	else:
		body = "\n\n".join(
			[
				f"Hi {lead.name} team,",
				f"I came across {lead.website or lead.name} and noticed {signal}.",
				f"We help local businesses with {offer.lower()}.",
				"Would a short call this week be useful?",
				"Best,\n[Your name]",
			]
		)
		subject = f"Quick idea for {lead.name} — {city}" if channel == "email" else ""

	second_channel = "call" if lead.phone and channel != "call" else "email"
	return {
		"subject": subject,
		"body": body,
		"why_now": lead.why[0] if lead.why else "Strong fit for your target segment.",
		"evidence_used": lead.why[:2],
		"followup_hint": "If no reply in 3 days, follow up with one short line referencing the same signal.",
		"followup_plan": [
			{
				"day": 3,
				"channel": channel if channel in ("email", "linkedin") else "email",
				"goal": "bump",
				"message_idea": f"One-line bump referencing {signal}.",
			},
			{
				"day": 7,
				"channel": second_channel,
				"goal": "new angle",
				"message_idea": "Short note on a second benefit (time saved on missed calls) with the same evidence.",
			},
			{
				"day": 14,
				"channel": "email",
				"goal": "close the loop",
				"message_idea": "Polite last touch: leave the door open and stop the sequence.",
			},
		],
		"source": "fallback",
	}
