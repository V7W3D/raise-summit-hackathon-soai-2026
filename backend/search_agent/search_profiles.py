"""Search depth profiles mapped to mission priority (MODE step)."""

from __future__ import annotations

from typing import Literal

from search_agent.planning.llm import llm_planning_available
from search_agent.schemas import SearchOptions

SearchMode = Literal["fast", "balanced", "deep"]
MissionPriority = Literal["fast_wins", "high_value", "broad_coverage"]

SEARCH_MODE_LABELS: dict[SearchMode, str] = {
	"fast": "Fast search",
	"balanced": "Balanced search",
	"deep": "Deep search",
}


def priority_to_search_mode(priority: str | None) -> SearchMode:
	if priority == "fast_wins":
		return "fast"
	if priority == "broad_coverage":
		return "deep"
	return "balanced"


def search_options_for_priority(priority: str | None) -> SearchOptions:
	"""Map mission MODE to concrete search-agent limits."""
	mode = priority_to_search_mode(priority)
	llm_ok = llm_planning_available()

	if mode == "fast":
		return SearchOptions(
			search_mode="fast",
			max_queries=3,
			max_results_per_query=5,
			max_pages_to_fetch=8,
			max_rounds=1,
			queries_per_round=3,
			include_sources=["web"],
			allow_llm=False,
			deep_search=False,
			llm_score_candidates=False,
		)

	if mode == "deep":
		return SearchOptions(
			search_mode="deep",
			max_queries=16,
			max_results_per_query=10,
			max_pages_to_fetch=50,
			max_rounds=3,
			queries_per_round=4,
			include_sources=["web", "directories", "maps"],
			allow_llm=llm_ok,
			deep_search=llm_ok,
			llm_score_candidates=llm_ok,
		)

	# balanced — high_value
	return SearchOptions(
		search_mode="balanced",
		max_queries=6,
		max_results_per_query=8,
		max_pages_to_fetch=14,
		max_rounds=1,
		queries_per_round=6,
		include_sources=["web", "directories"],
		allow_llm=llm_ok,
		deep_search=False,
		llm_score_candidates=False,
	)


def search_mode_label(priority: str | None) -> str:
	return SEARCH_MODE_LABELS[priority_to_search_mode(priority)]
