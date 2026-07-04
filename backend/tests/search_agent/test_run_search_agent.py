from search_agent import run_search_agent
from search_agent.fetching import MockPageFetcher
from search_agent.providers import MockSearchProvider, ProviderSearchOptions
from search_agent.providers.base import RawSearchResult, SearchProvider
from search_agent.schemas import SearchAgentOutput

from .fixtures import example_input


def _run(agent_input=None):
    return run_search_agent(
        agent_input or example_input(),
        provider=MockSearchProvider(),
        fetcher=MockPageFetcher(),
    )


def test_full_mock_run_succeeds():
    output = _run()
    assert output.status == "success"
    assert output.summary.candidates_created == 4
    assert output.summary.duplicates_removed == 0
    assert output.summary.queries_run == len(output.search_plan.generated_queries)
    assert output.summary.pages_fetched == 4


def test_expected_grouping_of_mock_leads():
    output = _run()
    by_name = {c.name: c for c in output.candidates}

    assert (
        by_name["Rhône Plomberie"].classification.category == "high_fit"
    )
    assert by_name["BTP Rhône Services"].classification.category in (
        "high_fit",
        "promising_but_incomplete",
    )
    assert by_name["EcoBuild Lyon"].classification.category in (
        "promising_but_incomplete",
        "needs_verification",
    )
    assert (
        by_name["Paris Enterprise Construction Group"].classification.category
        == "rejected_or_low_fit"
    )


def test_high_fit_lead_has_contact_and_action():
    output = _run()
    rhone = next(c for c in output.candidates if c.name == "Rhône Plomberie")
    assert any(e.value == "contact@rhoneplomberie.fr" for e in rhone.contact.emails)
    assert rhone.contact.phones
    assert rhone.classification.recommended_next_action == "draft_outreach"
    assert rhone.evidence


def test_ecobuild_without_contact_is_not_high_fit():
    output = _run()
    ecobuild = next(c for c in output.candidates if c.name == "EcoBuild Lyon")
    assert not ecobuild.contact.emails
    assert not ecobuild.contact.phones
    assert ecobuild.classification.category != "high_fit"


def test_candidates_sorted_by_overall_score_desc():
    output = _run()
    scores = [c.scores.overall_score for c in output.candidates]
    assert scores == sorted(scores, reverse=True)


def test_groups_reference_existing_candidate_ids():
    output = _run()
    all_ids = {c.id for c in output.candidates}
    grouped = (
        output.groups.high_fit
        + output.groups.promising_but_incomplete
        + output.groups.needs_verification
        + output.groups.rejected_or_low_fit
    )
    assert set(grouped) == all_ids
    assert len(grouped) == len(all_ids)


def test_output_round_trips_through_schema():
    output = _run()
    dumped = output.model_dump(by_alias=True)
    revalidated = SearchAgentOutput.model_validate(dumped)
    assert revalidated.request_id == output.request_id
    assert "searchPlan" in dumped
    assert "generatedQueries" in dumped["searchPlan"]


def test_duplicate_same_domain_results_merge():
    duplicated = [
        RawSearchResult(
            title="Rhône Plomberie - Plombier à Lyon",
            url="https://rhoneplomberie.fr",
            snippet="Plombier à Lyon, dépannage 24h/24.",
        ),
        RawSearchResult(
            title="Rhône Plomberie | Dépannage plomberie Lyon",
            url="https://www.rhoneplomberie.fr/",
            snippet="Devis gratuit, intervention rapide.",
        ),
    ]

    class DuplicatingProvider(SearchProvider):
        name = "mock"

        def search(self, query, options):
            return duplicated

    agent_input = example_input()
    agent_input.search_options.max_queries = 1
    output = run_search_agent(
        agent_input, provider=DuplicatingProvider(), fetcher=MockPageFetcher()
    )
    # 1 query x 2 raw results sharing one domain -> 1 candidate.
    assert output.summary.candidates_created == 1
    assert output.summary.duplicates_removed >= 1


def test_failing_provider_produces_failed_or_warning_not_crash():
    class ExplodingProvider(SearchProvider):
        name = "exploding"

        def search(self, query, options):
            raise RuntimeError("boom")

    output = run_search_agent(
        example_input(), provider=ExplodingProvider(), fetcher=MockPageFetcher()
    )
    assert output.status == "failed"
    assert any(w.code == "query_failed" for w in output.warnings)


def test_partial_failure_still_returns_candidates():
    calls = {"n": 0}

    class FlakyProvider(SearchProvider):
        name = "flaky"

        def __init__(self):
            self._inner = MockSearchProvider()

        def search(self, query, options):
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("temporary failure")
            return self._inner.search(query, options)

    output = run_search_agent(
        example_input(), provider=FlakyProvider(), fetcher=MockPageFetcher()
    )
    assert output.status == "partial_success"
    assert output.summary.candidates_created > 0


def test_invalid_input_dict_returns_failed():
    output = run_search_agent({"requestId": "req_bad"})
    assert output.status == "failed"
    assert any(w.code == "invalid_input" for w in output.warnings)


def test_dry_run_returns_plan_only():
    agent_input = example_input()
    agent_input.search_options.dry_run = True
    output = _run(agent_input)
    assert output.status == "success"
    assert output.search_plan.generated_queries
    assert output.candidates == []


def test_trace_records_pipeline_steps():
    output = _run()
    steps = {event.step for event in output.trace}
    assert {"input", "plan", "provider", "search", "extract", "classify"} <= steps
