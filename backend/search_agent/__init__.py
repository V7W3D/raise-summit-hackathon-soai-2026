"""ProspectPath Search Agent.

Public surface:
    run_search_agent(input) -> SearchAgentOutput
    to_discover_card(candidate) -> DiscoverLeadCardVM
"""

from .agent import run_search_agent
from .schemas import (
    BusinessProfile,
    CandidateLead,
    DiscoverLeadCardVM,
    Mission,
    ProviderOptions,
    SearchAgentInput,
    SearchAgentOutput,
    SearchOptions,
)
from .view_models import to_discover_card

__all__ = [
    "BusinessProfile",
    "CandidateLead",
    "DiscoverLeadCardVM",
    "Mission",
    "ProviderOptions",
    "SearchAgentInput",
    "SearchAgentOutput",
    "SearchOptions",
    "run_search_agent",
    "to_discover_card",
]
