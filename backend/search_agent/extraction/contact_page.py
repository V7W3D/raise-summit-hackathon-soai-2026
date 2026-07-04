"""Contact-page link detection inside a fetched HTML page."""

import re
from urllib.parse import urljoin

from ..utils import normalize_text
from .url import get_domain

ANCHOR_RE = re.compile(
    r"<a[^>]+href=[\"']([^\"'#]+)[\"'][^>]*>(.*?)</a>", re.IGNORECASE | re.DOTALL
)

CONTACT_KEYWORDS = (
    "contact",
    "contactez",
    "nous-contacter",
    "nous contacter",
    "contact-us",
    "contact us",
    "a-propos",
    "a propos",
    "about",
    "equipe",
    "team",
)


def find_likely_contact_page_links(html: str, base_url: str) -> list[str]:
    """Return absolute same-domain URLs that look like contact/about pages."""
    base_domain = get_domain(base_url)
    results: list[str] = []
    for href, anchor_text in ANCHOR_RE.findall(html):
        haystack = normalize_text(href + " " + anchor_text)
        if not any(keyword in haystack for keyword in CONTACT_KEYWORDS):
            continue
        absolute = urljoin(base_url if base_url.endswith("/") else base_url + "/", href)
        if get_domain(absolute) != base_domain:
            continue
        if absolute not in results:
            results.append(absolute)
    return results
