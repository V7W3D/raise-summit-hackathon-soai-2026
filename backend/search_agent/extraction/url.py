"""URL normalization and domain extraction (deterministic, no LLM)."""

from urllib.parse import urlsplit, urlunsplit


def normalize_url(url: str) -> str:
    """Normalize a URL: ensure scheme, lowercase host, drop fragment and
    trailing slash."""
    url = url.strip()
    if not url:
        return ""
    if "://" not in url:
        url = "https://" + url
    parts = urlsplit(url)
    netloc = parts.netloc.lower()
    path = parts.path.rstrip("/")
    return urlunsplit((parts.scheme.lower(), netloc, path, parts.query, ""))


def get_domain(url: str) -> str:
    """Return the registrable host without a leading www."""
    normalized = normalize_url(url)
    if not normalized:
        return ""
    host = urlsplit(normalized).netloc
    if ":" in host:
        host = host.split(":", 1)[0]
    if host.startswith("www."):
        host = host[4:]
    return host
