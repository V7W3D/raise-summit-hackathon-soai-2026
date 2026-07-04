from search_agent.planning import build_fallback_plan

from .fixtures import example_input


def test_construction_lyon_plan_expands_trades():
    plan = build_fallback_plan(example_input())
    assert "plombier" in plan.target_segments
    assert any("rénovation" in s for s in plan.target_segments)
    assert plan.target_personas  # owner, office manager, ...
    assert "owner" in plan.target_personas


def test_query_generation_for_construction_lyon():
    plan = build_fallback_plan(example_input())
    assert plan.generated_queries
    assert len(plan.generated_queries) <= 6  # respects maxQueries
    assert all("lyon" in q.lower() for q in plan.generated_queries)
    # French market -> French query templates.
    assert any("devis" in q or "urgence" in q for q in plan.generated_queries)


def test_bad_fit_signals_include_profile_entries():
    plan = build_fallback_plan(example_input())
    assert "very large enterprises" in plan.bad_fit_signals


def test_find_hires_generates_limited_queries():
    agent_input = example_input()
    agent_input.mission.goal_type = "find_hires"
    plan = build_fallback_plan(agent_input)
    # No job-platform scraping: a single conservative company-page query.
    assert len(plan.generated_queries) == 1


def test_unknown_industry_falls_back_to_ideal_customers():
    agent_input = example_input()
    agent_input.mission.description = "Find good prospects"
    agent_input.mission.target_industry = None
    plan = build_fallback_plan(agent_input)
    assert plan.target_segments
    assert plan.generated_queries
