"""Shared test fixtures: the CallPilot AI / Lyon construction example."""

from search_agent import (
    BusinessProfile,
    Mission,
    ProviderOptions,
    SearchAgentInput,
    SearchOptions,
)


def example_input(**overrides) -> SearchAgentInput:
    base = SearchAgentInput(
        request_id="req_test",
        business_profile=BusinessProfile(
            business_id="biz_callpilot",
            business_name="CallPilot AI",
            business_type="B2B SaaS",
            what_we_sell="AI phone receptionist for small service businesses",
            target_geographies=["France"],
            ideal_customers=["small local service companies that receive many calls"],
            bad_fit_customers=[
                "very large enterprises",
                "businesses with no phone-based workflow",
            ],
            languages=["fr"],
        ),
        mission=Mission(
            mission_id="mission_lyon",
            goal_type="find_clients",
            description=(
                "Find small construction service businesses in Lyon likely to "
                "need AI call reception."
            ),
            target_location="Lyon",
            target_industry="construction",
            language="fr",
        ),
        search_options=SearchOptions(max_queries=6),
        provider_options=ProviderOptions(provider="mock"),
    )
    return base.model_copy(update=overrides) if overrides else base
