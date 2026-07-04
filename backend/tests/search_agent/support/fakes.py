"""Test-only search/page doubles (not used in production)."""

from search_agent.extraction.html import clean_text, extract_title
from search_agent.extraction.url import normalize_url
from search_agent.fetching.base import FetchedPage, PageFetcher
from search_agent.providers.base import ProviderSearchOptions, RawSearchResult, SearchProvider
from search_agent.utils import normalize_text

from .fixture_data import MOCK_PAGES, MOCK_SEARCH_RESULTS


class FakeSearchProvider(SearchProvider):
	"""Returns canned results, distributing them across queries."""

	name = "fake"

	def __init__(self, fixtures: list[RawSearchResult] | None = None) -> None:
		self._fixtures = list(fixtures or MOCK_SEARCH_RESULTS)
		self._returned: set[str] = set()

	def search(
		self, query: str, options: ProviderSearchOptions
	) -> list[RawSearchResult]:
		remaining = [r for r in self._fixtures if r.url not in self._returned]
		if not remaining:
			return []

		query_tokens = set(normalize_text(query).split())
		matching = [
			r
			for r in remaining
			if query_tokens
			& set(normalize_text(f"{r.title} {r.snippet or ''}").split())
		]
		chosen = (matching or remaining)[: max(1, options.max_results)]
		chosen = chosen[:2]
		self._returned.update(r.url for r in chosen)
		return chosen


class FakePageFetcher(PageFetcher):
	def __init__(self, pages: dict[str, str] | None = None) -> None:
		self._pages = {normalize_url(url): html for url, html in (pages or MOCK_PAGES).items()}

	def fetch_page(self, url: str) -> FetchedPage:
		html = self._pages.get(normalize_url(url))
		if html is None:
			return FetchedPage(url=url, status=404, ok=False, error="not_found")
		return FetchedPage(
			url=url,
			final_url=url,
			status=200,
			ok=True,
			title=extract_title(html),
			text=clean_text(html),
			html=html,
		)
