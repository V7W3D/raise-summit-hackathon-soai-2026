from search_agent import run_search_agent, to_discover_card
from tests.search_agent.support.fakes import FakePageFetcher, FakeSearchProvider

from .fixtures import example_input


def test_discover_card_view_model():
	output = run_search_agent(
		example_input(), provider=FakeSearchProvider(), fetcher=FakePageFetcher()
	)
	card = to_discover_card(output.candidates[0])
	assert card.title
	assert card.fit_score >= 0
