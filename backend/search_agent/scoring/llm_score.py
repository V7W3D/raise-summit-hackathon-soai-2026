"""Groq-based lead scoring for evolutive deep search (broad coverage)."""

from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx

from ..schemas import (
	CandidateLead,
	Classification,
	Scores,
	SearchAgentInput,
)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.1-8b-instant"
FALLBACK_MODELS = ("llama-3.3-70b-versatile",)

SCORE_PROMPT = """You are a B2B prospecting analyst scoring leads for a sales mission.
Given the seller's profile, mission targeting, and candidate companies found on the web,
score each candidate generously for broad market coverage — only reject clear misfits.

Return JSON only:
{
  "candidates": [
    {
      "id": "same id from input",
      "score": 0-100,
      "category": "high_fit | promising | needs_verification | rejected",
      "reasons": ["why this is or isn't a fit"],
      "missing": ["what info is missing if any"]
    }
  ]
}

Rules:
- category high_fit: strong match to mission.targetIndustry and triggerSignals
- category promising: likely fit but incomplete contact or unclear role
- category needs_verification: might fit, needs human check
- category rejected: clearly wrong industry, location, or bad_fit
- Prefer keeping local businesses that match the target over rejecting for missing phone
- Score reflects fit for what the mission is hunting, NOT what the seller sells"""


def _api_key() -> str:
	return os.environ.get("GROQ_API_KEY", "").strip().strip('"').strip("'")


def _model_candidates() -> list[str]:
	raw = os.environ.get("GROQ_MODEL", DEFAULT_MODEL).strip().strip('"').strip("'")
	if "/" in raw:
		raw = raw.rsplit("/", 1)[-1]
	primary = raw or DEFAULT_MODEL
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
	return json.loads(text)


_CATEGORY_MAP = {
	"high_fit": "high_fit",
	"promising": "promising_but_incomplete",
	"promising_but_incomplete": "promising_but_incomplete",
	"needs_verification": "needs_verification",
	"rejected": "rejected_or_low_fit",
	"rejected_or_low_fit": "rejected_or_low_fit",
}


def _action_for_category(category: str, has_contact: bool) -> str:
	if category == "high_fit":
		return "draft_outreach" if has_contact else "find_contact"
	if category == "promising_but_incomplete":
		return "find_contact" if not has_contact else "investigate_more"
	if category == "needs_verification":
		return "open_details"
	return "reject"


def _candidate_payload(candidate: CandidateLead) -> dict[str, Any]:
	evidence = [
		{"quote": e.snippet[:200], "type": e.evidence_type}
		for e in candidate.evidence[:3]
	]
	return {
		"id": candidate.id,
		"name": candidate.name,
		"description": candidate.short_description or "",
		"location": candidate.location or "",
		"website": candidate.domain or candidate.website_url or "",
		"hasEmail": bool(candidate.contact.emails),
		"hasPhone": bool(candidate.contact.phones),
		"evidence": evidence,
	}


def score_candidates_with_llm(
	candidates: list[CandidateLead],
	agent_input: SearchAgentInput,
	*,
	batch_size: int = 6,
) -> int:
	"""Score candidates in batches via Groq. Returns count successfully scored."""
	api_key = _api_key()
	if not api_key or not candidates:
		return 0

	mission = agent_input.mission
	scored = 0

	for start in range(0, len(candidates), batch_size):
		batch = candidates[start : start + batch_size]
		payload = {
			"businessProfile": agent_input.business_profile.model_dump(by_alias=True),
			"mission": mission.model_dump(by_alias=True),
			"candidates": [_candidate_payload(c) for c in batch],
		}
		user_prompt = json.dumps(payload, ensure_ascii=False)

		parsed: dict[str, Any] | None = None
		for model in _model_candidates():
			try:
				response = httpx.post(
					GROQ_API_URL,
					headers={"Authorization": f"Bearer {api_key}"},
					json={
						"model": model,
						"messages": [
							{"role": "system", "content": SCORE_PROMPT},
							{"role": "user", "content": user_prompt},
						],
						"temperature": 0.25,
						"response_format": {"type": "json_object"},
					},
					timeout=60.0,
				)
				response.raise_for_status()
				text = (response.json()["choices"][0]["message"]["content"] or "").strip()
				parsed = _extract_json(text)
				break
			except Exception:
				continue

		if not parsed:
			continue

		by_id = {
			str(item.get("id", "")): item
			for item in (parsed.get("candidates") or [])
			if isinstance(item, dict)
		}

		for candidate in batch:
			item = by_id.get(candidate.id)
			if not item:
				continue
			try:
				score = max(0, min(100, int(item.get("score", 50))))
			except (TypeError, ValueError):
				score = 50
			raw_cat = str(item.get("category", "needs_verification")).lower()
			category = _CATEGORY_MAP.get(raw_cat, "needs_verification")
			reasons = [str(r) for r in (item.get("reasons") or []) if str(r).strip()]
			missing = [str(m) for m in (item.get("missing") or []) if str(m).strip()]
			has_contact = bool(candidate.contact.emails or candidate.contact.phones)

			candidate.scores = Scores(
				fit_score=float(score),
				contactability_score=70.0 if has_contact else 20.0,
				evidence_quality_score=min(100.0, len(candidate.evidence) * 25.0),
				overall_score=float(score),
			)
			candidate.classification = Classification(
				category=category,  # type: ignore[arg-type]
				confidence="high" if score >= 75 or score <= 30 else "medium",
				reasons=reasons or ["Scored by deep-search LLM"],
				missing_info=missing,
				recommended_next_action=_action_for_category(category, has_contact),  # type: ignore[arg-type]
			)
			scored += 1

	return scored
