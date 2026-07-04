"""Brave Search adapter. Requires BRAVE_API_KEY.

API shape based on https://api.search.brave.com docs (verify before
production use).
"""

import os
from urllib.parse import urlencode

from .base import (
    HttpRequestSpec,
    ProviderSearchOptions,
    RawSearchResult,
    SearchProvider,
    http_json,
)


class BraveSearchProvider(SearchProvider):
    name = "brave"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.environ.get("BRAVE_API_KEY", "")
        if not self.api_key:
            raise ValueError("BRAVE_API_KEY is not set")

    def search(
        self, query: str, options: ProviderSearchOptions
    ) -> list[RawSearchResult]:
        params = {"q": query, "count": options.max_results}
        payload = http_json(
            HttpRequestSpec(
                url="https://api.search.brave.com/res/v1/web/search?"
                + urlencode(params),
                headers={
                    "X-Subscription-Token": self.api_key,
                    "Accept": "application/json",
                },
            )
        )
        results = payload.get("web", {}).get("results", [])
        return [
            RawSearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("description"),
                source=self.name,
                published_date=item.get("age"),
            )
            for item in results
            if item.get("url")
        ]
