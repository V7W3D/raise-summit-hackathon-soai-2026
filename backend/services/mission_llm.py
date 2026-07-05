"""Groq-powered mission targeting via the OpenAI-compatible chat completions API."""

from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

from models.schemas.mission_assist import MissionAssistResponse
from services.mission_intelligence import suggest_industries_from_profile

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.1-8b-instant"
FALLBACK_MODELS = ("llama-3.3-70b-versatile",)

TARGET_KEYWORDS_PROMPT = """You suggest B2B prospecting target types for a seller.
Given the business profile, return 5 to 7 one-word target keywords the seller should prospect.

Rules:
- Each keyword must be exactly ONE word (e.g. Plumber, Electrician, Clinic, Garage).
- Keywords must be realistic prospects for what this business sells.
- Prefer local service businesses when the profile targets small service companies.
- Use title case for each keyword.
- No duplicates.

Return JSON only:
{"keywords": ["Plumber", "Electrician", "Locksmith", "Garage", "Clinic"]}"""

SYSTEM_PROMPT = """You are a B2B prospecting strategist helping sales teams define targeting missions.
Given a business profile and a natural-language description of who the user wants to find,
return a JSON object only — no markdown, no commentary.

Rules:
- Be specific and practical for local B2B prospecting.
- Suggest realistic buyer roles, trigger signals, and filters.
- Infer location from the query when mentioned; otherwise leave location empty.
- related_targets must contain 4-6 alternative target types the user might also want.
- Use concise labels matching common sales vocabulary.
- Align suggestions with what the seller actually sells.
- Prefer French market context when geographies include France.

Return JSON matching this schema:
{
  "target": "short slug e.g. plumber",
  "target_label": "display label e.g. Plumbers",
  "related_targets": ["Electricians", "Locksmiths"],
  "location": "city/region if mentioned else empty string",
  "buyer_roles": ["Owner", "Operations manager"],
  "trigger_signals": ["High call volume", "Missed calls"],
  "must_have_filters": ["Visible phone number"],
  "nice_to_have_filters": ["Google Maps listing"],
  "negative_filters": ["Franchises"],
  "mission_priority": "fast_wins|high_value|broad_coverage",
  "outreach_channel": "email|phone|linkedin|mixed",
  "target_business_size": "solo|small|medium|large",
  "suggested_lead_count": 25,
  "reasoning": "one sentence explaining the targeting strategy"
}"""


class MissionLLMError(Exception):
	"""Raised when the LLM call fails or returns invalid data."""


def _api_key() -> str:
	return os.environ.get("GROQ_API_KEY", "").strip().strip('"').strip("'")


def llm_available() -> bool:
	return bool(_api_key())


def _resolve_model() -> str:
	raw = os.environ.get("GROQ_MODEL", DEFAULT_MODEL).strip().strip('"').strip("'")
	if "/" in raw:
		raw = raw.rsplit("/", 1)[-1]
	return raw or DEFAULT_MODEL


def _model_candidates() -> list[str]:
	primary = _resolve_model()
	models = [primary]
	for fallback in FALLBACK_MODELS:
		if fallback not in models:
			models.append(fallback)
	return models


def _extract_json(text: str) -> dict[str, Any]:
	text = text.strip()
	if text.startswith("```"):
		text = re.sub(r"^```(?:json)?\s*", "", text)
		text = re.sub(r"\s*```$", "", text)
	try:
		return json.loads(text)
	except json.JSONDecodeError as exc:
		raise MissionLLMError("The LLM returned invalid JSON") from exc


def _generate_with_llm(
	*, user_prompt: str, system_instruction: str = SYSTEM_PROMPT
) -> str:
	api_key = _api_key()
	if not api_key:
		raise MissionLLMError("GROQ_API_KEY is not configured")

	last_error: Exception | None = None

	for model in _model_candidates():
		try:
			response = httpx.post(
				GROQ_API_URL,
				headers={"Authorization": f"Bearer {api_key}"},
				json={
					"model": model,
					"messages": [
						{"role": "system", "content": system_instruction},
						{"role": "user", "content": user_prompt},
					],
					"temperature": 0.4,
					"response_format": {"type": "json_object"},
				},
				timeout=30.0,
			)
			response.raise_for_status()
			data = response.json()
			text = (data["choices"][0]["message"]["content"] or "").strip()
			if text:
				return text
			raise MissionLLMError("Groq returned an empty response")
		except MissionLLMError:
			raise
		except Exception as exc:
			last_error = exc
			continue

	message = str(last_error) if last_error else "Groq request failed"
	if "429" in message:
		raise MissionLLMError(
			"Groq rate limit reached. Wait a moment and try again."
		) from last_error
	if "401" in message or "403" in message:
		raise MissionLLMError(
			"Groq authentication failed. Check GROQ_API_KEY in backend/.env "
			"(console.groq.com/keys)."
		) from last_error
	raise MissionLLMError(f"Groq request failed: {message}") from last_error


def _normalize_list(value: object) -> list[str]:
	if not isinstance(value, list):
		return []
	return [str(item).strip() for item in value if str(item).strip()]


def _normalize_priority(value: object) -> str | None:
	text = str(value or "").strip()
	if text in {"fast_wins", "high_value", "broad_coverage"}:
		return text
	return None


def _normalize_channel(value: object) -> str | None:
	text = str(value or "").strip()
	if text in {"email", "phone", "linkedin", "mixed"}:
		return text
	return None


def _normalize_size(value: object) -> str | None:
	text = str(value or "").strip()
	if text in {"solo", "small", "medium", "large"}:
		return text
	return None


def _normalize_one_word(value: str) -> str:
	word = value.strip().split()[0] if value.strip() else ""
	if not word:
		return ""
	return word[0].upper() + word[1:].lower()


def _normalize_keywords(values: object) -> list[str]:
	if not isinstance(values, list):
		return []
	seen: set[str] = set()
	keywords: list[str] = []
	for item in values:
		normalized = _normalize_one_word(str(item))
		key = normalized.lower()
		if normalized and key not in seen:
			seen.add(key)
			keywords.append(normalized)
	return keywords[:7]


def generate_target_keywords(
	*,
	business_profile: dict[str, Any] | None = None,
) -> tuple[list[str], str]:
	user_prompt = json.dumps({"businessProfile": business_profile or {}}, ensure_ascii=False)
	try:
		raw = _generate_with_llm(
			user_prompt=user_prompt,
			system_instruction=TARGET_KEYWORDS_PROMPT,
		)
		parsed = _extract_json(raw)
		keywords = _normalize_keywords(parsed.get("keywords"))
		if len(keywords) >= 5:
			return keywords[:7], "llm"
	except (MissionLLMError, Exception):
		pass

	fallback = suggest_industries_from_profile(
		business_profile.get("idealCustomers") if business_profile else None,
		business_profile.get("businessType") if business_profile else None,
	)
	keywords = _normalize_keywords(fallback)
	if len(keywords) < 5:
		keywords = _normalize_keywords(
			["Plumber", "Electrician", "Locksmith", "Garage", "Clinic", "Restaurant", "Construction"]
		)
	return keywords[:7], "fallback"


def generate_mission_assist(
	*,
	query: str,
	business_profile: dict[str, Any] | None = None,
	current_location: str = "",
) -> MissionAssistResponse:
	query = query.strip()
	if len(query) < 3:
		raise MissionLLMError("Describe who you are looking for in at least a few words.")

	user_payload = {
		"userQuery": query,
		"currentLocation": current_location,
		"businessProfile": business_profile or {},
	}
	user_prompt = json.dumps(user_payload, ensure_ascii=False)

	raw = _generate_with_llm(user_prompt=user_prompt)
	parsed = _extract_json(raw)

	target_label = str(parsed.get("target_label") or parsed.get("target") or "").strip()
	target = str(parsed.get("target") or target_label).strip()
	if not target:
		raise MissionLLMError("The LLM did not identify a target type.")

	related = _normalize_list(parsed.get("related_targets"))
	if target_label and target_label not in related:
		related = [target_label, *related]
	related = related[:8]

	lead_count = parsed.get("suggested_lead_count")
	try:
		suggested_lead_count = int(lead_count) if lead_count is not None else 25
		if suggested_lead_count < 1:
			suggested_lead_count = 25
	except (TypeError, ValueError):
		suggested_lead_count = 25

	return MissionAssistResponse(
		target=target,
		target_label=target_label or target,
		related_targets=related,
		location=str(parsed.get("location") or "").strip(),
		buyer_roles=_normalize_list(parsed.get("buyer_roles")),
		trigger_signals=_normalize_list(parsed.get("trigger_signals")),
		must_have_filters=_normalize_list(parsed.get("must_have_filters")),
		nice_to_have_filters=_normalize_list(parsed.get("nice_to_have_filters")),
		negative_filters=_normalize_list(parsed.get("negative_filters")),
		mission_priority=_normalize_priority(parsed.get("mission_priority")),
		outreach_channel=_normalize_channel(parsed.get("outreach_channel")),
		target_business_size=_normalize_size(parsed.get("target_business_size")),
		suggested_lead_count=suggested_lead_count,
		reasoning=str(parsed.get("reasoning") or "").strip(),
		source="llm",
	)


def generate_fallback_assist(
	*,
	query: str,
	ideal_customers: list[str] | None = None,
	business_type: str | None = None,
) -> MissionAssistResponse:
	"""Deterministic fallback when LLM is unavailable."""
	suggestions = suggest_industries_from_profile(ideal_customers, business_type)
	target = suggestions[0] if suggestions else query.strip().split()[0].capitalize()
	return MissionAssistResponse(
		target=target.lower(),
		target_label=target,
		related_targets=suggestions,
		location="",
		buyer_roles=["Owner"],
		trigger_signals=["High call volume"],
		must_have_filters=["Visible phone number"],
		nice_to_have_filters=["Active website"],
		negative_filters=["Franchises"],
		mission_priority="fast_wins",
		outreach_channel="mixed",
		target_business_size="small",
		suggested_lead_count=25,
		reasoning="Fallback suggestions based on your business profile.",
		source="fallback",
	)
