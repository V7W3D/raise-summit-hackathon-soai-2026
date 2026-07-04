from fastapi import APIRouter

from search_agent import SearchAgentInput, SearchAgentOutput, run_search_agent

router = APIRouter(prefix="/search-agent", tags=["search-agent"])


@router.post("/run", response_model=SearchAgentOutput)
def run(payload: SearchAgentInput) -> SearchAgentOutput:
    """Run the Search Agent for a mission and return structured candidates."""
    return run_search_agent(payload)
