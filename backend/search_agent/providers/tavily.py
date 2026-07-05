"""Tavily search adapter. Requires TAVILY_API_KEY.

API shape based on https://docs.tavily.com (verify before production use).
"""

import os

from .base import (
    HttpRequestSpec,
    ProviderSearchOptions,
    RawSearchResult,
    SearchProvider,
    http_json,
)


class TavilySearchProvider(SearchProvider):
    name = "tavily"

    def __init__(self, api_key: str | None = None) -> None:
        raw = api_key or os.environ.get("TAVILY_API_KEY", "")
        self.api_key = raw.strip().strip('"').strip("'")
        if not self.api_key:
            raise ValueError("TAVILY_API_KEY is not set")

    def search(
        self, query: str, options: ProviderSearchOptions
    ) -> list[RawSearchResult]:
        payload = http_json(
            HttpRequestSpec(
                url="https://api.tavily.com/search",
                method="POST",
                headers={"Authorization": f"Bearer {self.api_key}"},
                body={"query": query, "max_results": options.max_results},
            )
        )
        return [
            RawSearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                snippet=item.get("content"),
                source=self.name,
                published_date=item.get("published_date"),
            )
            for item in payload.get("results", [])
            if item.get("url")
        ]
