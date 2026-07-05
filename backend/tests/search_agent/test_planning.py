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
    assert any("email" in q or "agence" in q or "annuaire" in q for q in plan.generated_queries)


def test_bad_fit_signals_include_profile_entries():
    plan = build_fallback_plan(example_input())
    assert "very large enterprises" in plan.bad_fit_signals


def test_unknown_industry_falls_back_to_ideal_customers():
    agent_input = example_input()
    agent_input.mission.description = "Find good prospects"
    agent_input.mission.target_industry = None
    plan = build_fallback_plan(agent_input)
    assert plan.target_segments
    assert plan.generated_queries


def test_social_media_target_uses_mission_not_profile():
    agent_input = example_input()
    agent_input.mission.target_industry = "agence social media"
    agent_input.mission.trigger_signals = ["community management", "Instagram"]
    agent_input.mission.description = (
        "Prospecting focus: social media agencies in Lyon."
    )
    plan = build_fallback_plan(agent_input)
    assert any("social" in s.lower() for s in plan.target_segments)
    assert any("social" in q.lower() or "community" in q.lower() for q in plan.generated_queries)
    assert not any("sécurité" in q.lower() or "cyber" in q.lower() for q in plan.generated_queries)
