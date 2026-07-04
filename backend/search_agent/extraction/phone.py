"""Phone number extraction with French + generic international support."""

import re

# 0X XX XX XX XX / 0X.XX.XX.XX.XX / +33 X XX XX XX XX
FRENCH_PHONE_RE = re.compile(r"(?:\+33[\s.\-]?[1-9]|0[1-9])(?:[\s.\-]?\d{2}){4}")

# Generic international: +country code then 7-13 digits with separators.
INTL_PHONE_RE = re.compile(r"\+\d{1,3}(?:[\s.\-]?\d{2,4}){2,5}")


def _clean(raw: str) -> str:
    digits = re.sub(r"[\s.\-]", " ", raw.strip())
    return re.sub(r"\s+", " ", digits)


def extract_phones(text: str) -> list[str]:
    """Return unique phone numbers found in raw text, French formats first."""
    found: list[str] = []
    for regex in (FRENCH_PHONE_RE, INTL_PHONE_RE):
        for match in regex.findall(text):
            cleaned = _clean(match)
            digit_count = sum(c.isdigit() for c in cleaned)
            if digit_count < 8 or digit_count > 14:
                continue
            if cleaned not in found:
                found.append(cleaned)
    return found
