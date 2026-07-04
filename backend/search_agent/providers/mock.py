"""Mock search provider used for demos and tests (no network calls)."""

from ..utils import normalize_text
from .base import ProviderSearchOptions, RawSearchResult, SearchProvider


class MockSearchProvider(SearchProvider):
    """Returns canned results, distributing them across queries.

    A fixture is returned at most once per agent run so the demo shows one
    fresh result per query instead of four duplicates of everything.
    """

    name = "mock"

    def __init__(self, fixtures: list[RawSearchResult] | None = None) -> None:
        if fixtures is None:
            from ..mock_data import MOCK_SEARCH_RESULTS

            fixtures = MOCK_SEARCH_RESULTS
        self._fixtures = list(fixtures)
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
            if query_tokens & set(normalize_text(f"{r.title} {r.snippet or ''}").split())
        ]
        chosen = (matching or remaining)[: max(1, options.max_results)]
        # Return at most 2 per query so results spread across the query list.
        chosen = chosen[:2]
        self._returned.update(r.url for r in chosen)
        return chosen
