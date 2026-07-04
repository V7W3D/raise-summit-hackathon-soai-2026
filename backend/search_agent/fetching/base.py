"""Page fetcher abstraction."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class FetchedPage:
    url: str
    final_url: Optional[str] = None
    status: Optional[int] = None
    ok: bool = False
    title: Optional[str] = None
    text: Optional[str] = None
    html: Optional[str] = None
    error: Optional[str] = None


class PageFetcher(ABC):
    @abstractmethod
    def fetch_page(self, url: str) -> FetchedPage:
        """Fetch one public page. Must not raise: errors are reported on
        FetchedPage.error so the agent can continue."""
