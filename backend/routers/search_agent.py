from fastapi import APIRouter, HTTPException, status

from search_agent import SearchAgentInput, SearchAgentOutput, run_search_agent
from search_agent.errors import ProviderNotConfiguredError

router = APIRouter(prefix="/search-agent", tags=["search-agent"])


@router.post("/run", response_model=SearchAgentOutput)
def run(payload: SearchAgentInput) -> SearchAgentOutput:
	"""Run the Search Agent for a mission and return structured candidates."""
	try:
		return run_search_agent(payload)
	except ProviderNotConfiguredError as exc:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail=str(exc),
		) from None
