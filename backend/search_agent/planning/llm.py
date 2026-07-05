"""Optional LLM-based search plan generation via Groq.

Used only for the semantic part of the pipeline (interpreting a vague
mission, expanding segments, generating queries). Everything downstream
stays deterministic.

Requires GROQ_API_KEY (same key as mission assist / outreach). When
unavailable, the caller falls back to the deterministic plan.
"""

from __future__ import annotations

import json
import os
import re

import httpx

from ..schemas import SearchAgentInput, SearchPlan

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.1-8b-instant"
FALLBACK_MODELS = ("llama-3.3-70b-versatile",)

SYSTEM_PROMPT = """You are a B2B prospecting strategy agent.
Given a business profile (what the seller sells) and a prospecting mission (who to find),
produce a search plan. Return JSON only — no markdown.

Critical rules:
- mission.targetIndustry and mission.description define WHO to find — the prospect type.
  This overrides businessProfile.whatWeSell. Never search for companies that sell the
  same thing as the seller unless the mission explicitly asks for that.
- mission.triggerSignals are buying signals for the TARGET prospects — weave them into
  queries and goodFitSignals.
- mission.negativeFilters and businessProfile.badFitCustomers belong in badFitSignals.
- Do NOT confuse the seller's product domain with the prospect type. Examples:
  * Seller offers "online safety for social media" + target "social media agencies"
    → search for social media / community management agencies, NOT cybersecurity firms.
  * Seller offers phone software + target "plumbers" → search for plumbers, not telcos.
- generatedQueries must find real prospect companies in mission.targetLocation.
- Include local-language queries when location/language suggests French or other locales.
- Do not recommend spam, logins, or platform-violating automation.
- Prefer public business websites, directories, and maps.

Return JSON matching this schema:
{
  "interpretedGoal": "one sentence: who we are finding and why",
  "targetPersonas": ["roles from mission.buyerRoles"],
  "targetSegments": ["concrete prospect types from mission.targetIndustry"],
  "goodFitSignals": ["signals from mission.triggerSignals"],
  "badFitSignals": ["from mission.negativeFilters"],
  "suggestedSources": ["web", "directories"],
  "generatedQueries": ["concrete search queries for the TARGET prospect type"],
  "assumptions": ["short assumption"]
}"""


def _api_key() -> str:
	return os.environ.get("GROQ_API_KEY", "").strip().strip('"').strip("'")


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


def _extract_json(text: str) -> dict:
	text = text.strip()
	if text.startswith("```"):
		text = re.sub(r"^```(?:json)?\s*", "", text)
		text = re.sub(r"\s*```$", "", text)
	return json.loads(text)


def llm_planning_available() -> bool:
	return bool(_api_key())


def build_llm_plan(agent_input: SearchAgentInput) -> SearchPlan:
	"""Call Groq to produce a search plan. Raises on any failure; the
	caller catches and falls back to the deterministic plan."""
	api_key = _api_key()
	if not api_key:
		raise RuntimeError("GROQ_API_KEY is not configured")

	mission = agent_input.mission
	user_payload = {
		"businessProfile": agent_input.business_profile.model_dump(by_alias=True),
		"mission": mission.model_dump(by_alias=True),
		"targetingPriority": (
			"Find prospects matching mission.targetIndustry and mission.triggerSignals. "
			"Ignore businessProfile.idealCustomers if they conflict with the mission."
		),
		"maxQueries": agent_input.search_options.max_queries,
	}
	user_prompt = (
		f"Build a search plan for this prospecting mission. "
		f"Return at most {agent_input.search_options.max_queries} generatedQueries.\n\n"
		f"{json.dumps(user_payload, ensure_ascii=False)}"
	)

	last_error: Exception | None = None
	for model in _model_candidates():
		try:
			response = httpx.post(
				GROQ_API_URL,
				headers={"Authorization": f"Bearer {api_key}"},
				json={
					"model": model,
					"messages": [
						{"role": "system", "content": SYSTEM_PROMPT},
						{"role": "user", "content": user_prompt},
					],
					"temperature": 0.3,
					"response_format": {"type": "json_object"},
				},
				timeout=45.0,
			)
			response.raise_for_status()
			data = response.json()
			text = (data["choices"][0]["message"]["content"] or "").strip()
			if not text:
				raise RuntimeError("Groq returned an empty response")
			plan = SearchPlan.model_validate(_extract_json(text))
			plan.generated_queries = plan.generated_queries[
				: agent_input.search_options.max_queries
			]
			return plan
		except Exception as exc:
			last_error = exc
			continue

	raise RuntimeError(str(last_error) if last_error else "Groq request failed")


REFINEMENT_PROMPT = """You are refining a B2B prospecting deep-search plan.
Given the initial plan, what was already searched, and sample result titles/snippets,
generate NEW follow-up search queries to broaden coverage and find more companies.

Rules:
- Do NOT repeat queries already run.
- Expand into adjacent segments, local directories, and niche phrasing.
- Stay aligned with mission.targetIndustry and mission.triggerSignals.
- Return 3 to 5 new queries only.

Return JSON: {"generatedQueries": ["query 1", "query 2"]}"""


def build_deep_refinement_queries(
	agent_input: SearchAgentInput,
	*,
	initial_plan: SearchPlan,
	queries_already_run: list[str],
	discovery_titles: list[str],
	max_new_queries: int = 4,
	round_learnings: list[str] | None = None,
) -> list[str]:
	"""Second-pass LLM query expansion for deep search."""
	api_key = _api_key()
	if not api_key:
		return []

	payload = {
		"mission": agent_input.mission.model_dump(by_alias=True),
		"initialPlan": initial_plan.model_dump(by_alias=True),
		"queriesAlreadyRun": queries_already_run,
		"discoverySample": discovery_titles[:12],
		"roundLearnings": (round_learnings or [])[-3:],
		"maxNewQueries": max_new_queries,
	}
	user_prompt = (
		f"Generate up to {max_new_queries} NEW follow-up queries.\n\n"
		f"{json.dumps(payload, ensure_ascii=False)}"
	)

	last_error: Exception | None = None
	for model in _model_candidates():
		try:
			response = httpx.post(
				GROQ_API_URL,
				headers={"Authorization": f"Bearer {api_key}"},
				json={
					"model": model,
					"messages": [
						{"role": "system", "content": REFINEMENT_PROMPT},
						{"role": "user", "content": user_prompt},
					],
					"temperature": 0.5,
					"response_format": {"type": "json_object"},
				},
				timeout=45.0,
			)
			response.raise_for_status()
			data = response.json()
			text = (data["choices"][0]["message"]["content"] or "").strip()
			parsed = _extract_json(text)
			queries = parsed.get("generatedQueries") or parsed.get("generated_queries") or []
			cleaned = [
				str(q).strip()
				for q in queries
				if str(q).strip() and str(q).strip() not in queries_already_run
			]
			return cleaned[:max_new_queries]
		except Exception as exc:
			last_error = exc
			continue

	if last_error:
		return []
	return []


ROUND_EVAL_PROMPT = """You evaluate a round of B2B web prospecting search results.
Given queries run, sample result titles, and the mission, explain what was found,
what gaps remain, and propose the next search queries.

Return JSON only:
{
  "learnings": "one paragraph: what types of businesses appeared, quality, gaps",
  "gaps": ["segment or angle still under-explored"],
  "suggestedQueries": ["3-5 NEW search queries for the next round"]
}

Rules:
- suggestedQueries must be NEW (not in queriesAlreadyRun)
- Stay aligned with mission.targetIndustry and triggerSignals
- Broaden into adjacent niches if results are thin
- Use local language when mission targets France"""


def evaluate_search_round(
	agent_input: SearchAgentInput,
	*,
	round_num: int,
	queries_run: list[str],
	result_titles: list[str],
	total_results: int,
) -> dict:
	"""LLM retrospective after each deep-search round."""
	api_key = _api_key()
	if not api_key:
		return {"learnings": "", "suggestedQueries": []}

	payload = {
		"round": round_num,
		"mission": agent_input.mission.model_dump(by_alias=True),
		"queriesAlreadyRun": queries_run,
		"resultTitlesSample": result_titles[:20],
		"totalResultsSoFar": total_results,
	}
	user_prompt = json.dumps(payload, ensure_ascii=False)

	for model in _model_candidates():
		try:
			response = httpx.post(
				GROQ_API_URL,
				headers={"Authorization": f"Bearer {api_key}"},
				json={
					"model": model,
					"messages": [
						{"role": "system", "content": ROUND_EVAL_PROMPT},
						{"role": "user", "content": user_prompt},
					],
					"temperature": 0.4,
					"response_format": {"type": "json_object"},
				},
				timeout=45.0,
			)
			response.raise_for_status()
			text = (response.json()["choices"][0]["message"]["content"] or "").strip()
			return _extract_json(text)
		except Exception:
			continue
	return {"learnings": "", "suggestedQueries": []}


