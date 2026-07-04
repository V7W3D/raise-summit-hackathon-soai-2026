"""Serper (Google SERP) adapter. Requires SERPER_API_KEY.

API shape based on https://serper.dev docs (verify before production use).
"""

import os

from .base import (
    HttpRequestSpec,
    ProviderSearchOptions,
    RawSearchResult,
    SearchProvider,
    http_json,
)


class SerperSearchProvider(SearchProvider):
    name = "serper"

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.environ.get("SERPER_API_KEY", "")
        if not self.api_key:
            raise ValueError("SERPER_API_KEY is not set")

    def search(
        self, query: str, options: ProviderSearchOptions
    ) -> list[RawSearchResult]:
        body = {"q": query, "num": options.max_results}
        if options.location:
            body["location"] = options.location
        if options.language:
            body["hl"] = options.language
        payload = http_json(
            HttpRequestSpec(
                url="https://google.serper.dev/search",
                method="POST",
                headers={"X-API-KEY": self.api_key},
                body=body,
            )
        )
        return [
            RawSearchResult(
                title=item.get("title", ""),
                url=item.get("link", ""),
                snippet=item.get("snippet"),
                source=self.name,
                published_date=item.get("date"),
            )
            for item in payload.get("organic", [])
            if item.get("link")
        ]
