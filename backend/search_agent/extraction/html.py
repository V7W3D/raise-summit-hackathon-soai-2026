"""Minimal HTML helpers: title extraction and text cleaning (no parser deps)."""

import html as html_lib
import re

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SCRIPT_STYLE_RE = re.compile(
    r"<(script|style)[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL
)
TAG_RE = re.compile(r"<[^>]+>")


def extract_title(html: str) -> str | None:
    match = TITLE_RE.search(html)
    if not match:
        return None
    title = html_lib.unescape(match.group(1)).strip()
    return re.sub(r"\s+", " ", title) or None


def clean_text(html: str) -> str:
    """Strip scripts, styles and tags; collapse whitespace."""
    without_scripts = SCRIPT_STYLE_RE.sub(" ", html)
    without_tags = TAG_RE.sub(" ", without_scripts)
    text = html_lib.unescape(without_tags)
    return re.sub(r"\s+", " ", text).strip()
