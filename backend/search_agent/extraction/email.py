"""Email extraction and classification (deterministic, no LLM)."""

import re

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

# Image/asset names like logo@2x.png must not be treated as emails.
ASSET_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js")

GENERIC_PREFIXES = (
    "info",
    "contact",
    "hello",
    "sales",
    "support",
    "admin",
    "bonjour",
    "accueil",
    "office",
)

PERSONAL_NAME_RE = re.compile(r"^[a-z]+[._\-][a-z]+$")


def extract_emails(text_or_html: str) -> list[str]:
    """Return unique emails found in raw text or HTML, in order of appearance."""
    seen: list[str] = []
    for match in EMAIL_RE.findall(text_or_html):
        email = match.strip(".").lower()
        if email.endswith(ASSET_SUFFIXES):
            continue
        if email not in seen:
            seen.append(email)
    return seen


def classify_email(email: str) -> str:
    """Classify an email as 'generic' (shared inbox) or 'personal'."""
    local = email.split("@", 1)[0].lower()
    if local.startswith(GENERIC_PREFIXES):
        return "generic"
    if PERSONAL_NAME_RE.match(local):
        return "personal"
    return "personal"
