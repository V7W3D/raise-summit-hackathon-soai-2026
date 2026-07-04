"""Candidate deduplication by normalized domain, then normalized name."""

import re

from .schemas import CandidateLead
from .utils import normalize_text

LEGAL_SUFFIXES = ("sarl", "sas", "sa", "eurl", "inc", "llc", "ltd", "gmbh")


def normalize_company_name(name: str) -> str:
    normalized = normalize_text(name)
    normalized = re.sub(r"[^a-z0-9 ]", " ", normalized)
    tokens = [t for t in normalized.split() if t not in LEGAL_SUFFIXES]
    return " ".join(tokens)


def _merge(primary: CandidateLead, duplicate: CandidateLead) -> None:
    for url in duplicate.source_urls:
        if url not in primary.source_urls:
            primary.source_urls.append(url)

    existing_evidence = {(e.source_url, e.evidence_type, e.snippet) for e in primary.evidence}
    for ev in duplicate.evidence:
        key = (ev.source_url, ev.evidence_type, ev.snippet)
        if key not in existing_evidence:
            primary.evidence.append(ev)
            existing_evidence.add(key)

    known_emails = {e.value for e in primary.contact.emails}
    primary.contact.emails.extend(
        e for e in duplicate.contact.emails if e.value not in known_emails
    )
    known_phones = {p.value for p in primary.contact.phones}
    primary.contact.phones.extend(
        p for p in duplicate.contact.phones if p.value not in known_phones
    )
    known_socials = {s.url for s in primary.contact.social_links}
    primary.contact.social_links.extend(
        s for s in duplicate.contact.social_links if s.url not in known_socials
    )
    if not primary.contact.contact_page_url:
        primary.contact.contact_page_url = duplicate.contact.contact_page_url

    if not primary.short_description and duplicate.short_description:
        primary.short_description = duplicate.short_description
    if not primary.website_url and duplicate.website_url:
        primary.website_url = duplicate.website_url
        primary.domain = duplicate.domain


def dedupe_candidates(
    candidates: list[CandidateLead],
) -> tuple[list[CandidateLead], int]:
    """Merge candidates sharing a domain (or, failing that, a very similar
    name). Returns (unique candidates, number of duplicates merged)."""
    unique: list[CandidateLead] = []
    by_key: dict[str, CandidateLead] = {}
    removed = 0

    for candidate in candidates:
        key = candidate.domain or normalize_company_name(candidate.name)
        existing = by_key.get(key)
        if existing is None and not candidate.domain:
            # Second-chance match on similar names for domain-less candidates.
            name_key = normalize_company_name(candidate.name)
            for other in unique:
                if normalize_company_name(other.name) == name_key:
                    existing = other
                    break
        if existing is not None:
            _merge(existing, candidate)
            removed += 1
        else:
            by_key[key] = candidate
            unique.append(candidate)

    return unique, removed
