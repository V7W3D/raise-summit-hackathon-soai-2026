"""HTTP page fetcher built on the standard library (no extra deps)."""

import gzip
import urllib.error
import urllib.request

from ..extraction.html import clean_text, extract_title
from .base import FetchedPage, PageFetcher

NON_HTML_SUFFIXES = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".zip",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".mp3", ".mp4",
)

USER_AGENT = (
    "Mozilla/5.0 (compatible; ProspectPathBot/0.1; +https://prospectpath.example)"
)

MAX_BYTES = 1_000_000  # never download more than ~1 MB per page


class BasicHttpPageFetcher(PageFetcher):
    def __init__(self, timeout: float = 10.0) -> None:
        self.timeout = timeout

    def fetch_page(self, url: str) -> FetchedPage:
        lowered = url.lower().split("?", 1)[0]
        if lowered.endswith(NON_HTML_SUFFIXES):
            return FetchedPage(url=url, ok=False, error="skipped_non_html_asset")

        request = urllib.request.Request(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*;q=0.5"},
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                status = response.status
                content_type = response.headers.get("Content-Type", "")
                if "html" not in content_type and "text" not in content_type:
                    return FetchedPage(
                        url=url,
                        final_url=response.url,
                        status=status,
                        ok=False,
                        error=f"non_html_content_type: {content_type}",
                    )
                raw = response.read(MAX_BYTES)
                if response.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.decompress(raw)
                html = raw.decode("utf-8", errors="replace")
                return FetchedPage(
                    url=url,
                    final_url=response.url,
                    status=status,
                    ok=200 <= status < 400,
                    title=extract_title(html),
                    text=clean_text(html),
                    html=html,
                )
        except urllib.error.HTTPError as exc:
            return FetchedPage(url=url, status=exc.code, ok=False, error=str(exc))
        except Exception as exc:  # timeouts, DNS failures, bad TLS, ...
            return FetchedPage(url=url, ok=False, error=str(exc))
