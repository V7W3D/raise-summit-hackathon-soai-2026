"""Optional LLM-based search plan generation.

Used only for the semantic part of the pipeline (interpreting a vague
mission, expanding segments, generating queries). Everything downstream
stays deterministic.

Requires the `anthropic` package and ANTHROPIC_API_KEY. Both are optional:
when unavailable, the caller falls back to the deterministic plan.
"""

import json
import os

from ..schemas import SearchAgentInput, SearchPlan

LLM_MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = """You are a prospecting strategy agent for small businesses.
Given the saved business profile and a prospecting mission, produce a search plan.
Return JSON only.
Rules:
- Be specific.
- Do not recommend spam.
- Do not search behind logins.
- Prefer public business websites, directories, maps, public pages.
- Generate queries likely to find real companies and contact pages.
- Include local-language queries when location/language suggests it.
- Avoid illegal or platform-violating automation."""

_STRING_ARRAY = {"type": "array", "items": {"type": "string"}}

PLAN_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "interpretedGoal": {"type": "string"},
        "targetPersonas": _STRING_ARRAY,
        "targetSegments": _STRING_ARRAY,
        "goodFitSignals": _STRING_ARRAY,
        "badFitSignals": _STRING_ARRAY,
        "suggestedSources": _STRING_ARRAY,
        "generatedQueries": _STRING_ARRAY,
        "assumptions": _STRING_ARRAY,
    },
    "required": [
        "interpretedGoal",
        "targetPersonas",
        "targetSegments",
        "goodFitSignals",
        "badFitSignals",
        "suggestedSources",
        "generatedQueries",
        "assumptions",
    ],
    "additionalProperties": False,
}


def llm_planning_available() -> bool:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return True


def build_llm_plan(agent_input: SearchAgentInput) -> SearchPlan:
    """Call Claude to produce a search plan. Raises on any failure; the
    caller catches and falls back to the deterministic plan."""
    import anthropic

    client = anthropic.Anthropic()
    user_payload = {
        "businessProfile": agent_input.business_profile.model_dump(by_alias=True),
        "mission": agent_input.mission.model_dump(by_alias=True),
        "maxQueries": agent_input.search_options.max_queries,
    }
    response = client.messages.create(
        model=LLM_MODEL,
        max_tokens=4096,  # plans are small structured JSON
        system=SYSTEM_PROMPT,
        output_config={"format": {"type": "json_schema", "schema": PLAN_JSON_SCHEMA}},
        messages=[{"role": "user", "content": json.dumps(user_payload)}],
    )
    text = next(block.text for block in response.content if block.type == "text")
    plan = SearchPlan.model_validate(json.loads(text))
    plan.generated_queries = plan.generated_queries[
        : agent_input.search_options.max_queries
    ]
    return plan
