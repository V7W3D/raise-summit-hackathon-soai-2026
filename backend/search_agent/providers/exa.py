"""Exa search adapter. Requires EXA_API_KEY.

API shape based on https://docs.exa.ai (verify before production use).
"""

import os

from .base import (
    HttpRequestSpec,
    ProviderSearchOptions,
    RawSearchResult,
    SearchProvider,
    http_json,
)


class ExaSearchProvider(SearchProvider):
    name = "exa"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.environ.get("EXA_API_KEY", "")
        if not self.api_key:
            raise ValueError("EXA_API_KEY is not set")

    def search(
        self, query: str, options: ProviderSearchOptions
    ) -> list[RawSearchResult]:
        payload = http_json(
            HttpRequestSpec(
                url="https://api.exa.ai/search",
                method="POST",
                headers={"x-api-key": self.api_key},
                body={
                    "query": query,
                    "numResults": options.max_results,
                    "contents": {"text": {"maxCharacters": 500}},
                },
            )
        )
        return [
            RawSearchResult(
                title=item.get("title") or "",
                url=item.get("url", ""),
                snippet=item.get("text"),
                source=self.name,
                published_date=item.get("publishedDate"),
            )
            for item in payload.get("results", [])
            if item.get("url")
        ]
