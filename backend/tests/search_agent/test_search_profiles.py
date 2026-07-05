"""Tests for mission-priority search profiles."""

from search_agent.search_profiles import (
	priority_to_search_mode,
	search_options_for_priority,
)


def test_fast_wins_uses_fast_search():
	opts = search_options_for_priority("fast_wins")
	assert opts.search_mode == "fast"
	assert opts.allow_llm is False
	assert opts.deep_search is False
	assert opts.max_queries <= 4


def test_high_value_uses_balanced_search():
	opts = search_options_for_priority("high_value")
	assert opts.search_mode == "balanced"
	assert opts.deep_search is False
	assert opts.max_queries == 6


def test_broad_coverage_uses_deep_search():
	opts = search_options_for_priority("broad_coverage")
	assert opts.search_mode == "deep"
	assert opts.max_rounds == 3
	assert opts.llm_score_candidates is True
	assert opts.max_queries >= 8
	assert opts.max_pages_to_fetch >= 40


def test_priority_to_search_mode_defaults_balanced():
	assert priority_to_search_mode(None) == "balanced"
	assert priority_to_search_mode("unknown") == "balanced"
