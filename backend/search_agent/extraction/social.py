"""Social profile link extraction (deterministic, no LLM)."""

import re

SOCIAL_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("linkedin", re.compile(r"https?://(?:[\w\-]+\.)?linkedin\.com/[^\s\"'<>)]+", re.I)),
    ("facebook", re.compile(r"https?://(?:[\w\-]+\.)?facebook\.com/[^\s\"'<>)]+", re.I)),
    ("instagram", re.compile(r"https?://(?:[\w\-]+\.)?instagram\.com/[^\s\"'<>)]+", re.I)),
    ("x", re.compile(r"https?://(?:[\w\-]+\.)?(?:twitter|x)\.com/[^\s\"'<>)]+", re.I)),
]


def extract_social_links(html_or_text: str) -> list[dict]:
    """Return [{"platform": ..., "url": ...}] for known social networks."""
    links: list[dict] = []
    seen: set[str] = set()
    for platform, pattern in SOCIAL_PATTERNS:
        for url in pattern.findall(html_or_text):
            url = url.rstrip(".,;")
            if url not in seen:
                seen.add(url)
                links.append({"platform": platform, "url": url})
    return links
