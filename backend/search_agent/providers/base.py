"""Search provider abstraction.

Every provider (mock or real) implements SearchProvider so the agent never
depends on a specific search API.
"""

import json
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class RawSearchResult:
    title: str
    url: str
    snippet: Optional[str] = None
    source: Optional[str] = None
    published_date: Optional[str] = None


@dataclass
class ProviderSearchOptions:
    max_results: int = 8
    location: Optional[str] = None
    language: Optional[str] = None


class SearchProvider(ABC):
    name: str = "abstract"

    @abstractmethod
    def search(
        self, query: str, options: ProviderSearchOptions
    ) -> list[RawSearchResult]:
        """Run one query and return raw results. Must raise on hard failure;
        the agent catches per-query errors and continues."""


@dataclass
class HttpRequestSpec:
    """Declarative HTTP request so real adapters share one transport."""

    url: str
    method: str = "GET"
    headers: dict = field(default_factory=dict)
    body: Optional[dict] = None
    timeout: float = 15.0


def http_json(spec: HttpRequestSpec) -> dict:
    """Tiny stdlib HTTP JSON client used by the real provider adapters."""
    data = None
    headers = dict(spec.headers)
    if spec.body is not None:
        data = json.dumps(spec.body).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    request = urllib.request.Request(
        spec.url, data=data, headers=headers, method=spec.method
    )
    with urllib.request.urlopen(request, timeout=spec.timeout) as response:
        return json.loads(response.read().decode("utf-8"))
