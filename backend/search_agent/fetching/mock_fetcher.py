"""Mock page fetcher serving canned HTML pages (no network)."""

from ..extraction.html import clean_text, extract_title
from ..extraction.url import normalize_url
from .base import FetchedPage, PageFetcher


class MockPageFetcher(PageFetcher):
    def __init__(self, pages: dict[str, str] | None = None) -> None:
        if pages is None:
            from ..mock_data import MOCK_PAGES

            pages = MOCK_PAGES
        # Key by normalized URL so lookups tolerate trailing slashes etc.
        self._pages = {normalize_url(url): html for url, html in pages.items()}

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
