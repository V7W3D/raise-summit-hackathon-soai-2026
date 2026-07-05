"""Match prospecting leads to registered Scouter network companies."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.business_profiles import BusinessProfile
from models.clients.leads import Lead
from search_agent.extraction.url import get_domain

NetworkBadge = Literal["verified", "sponsored"]


@dataclass(frozen=True)
class NetworkMemberMatch:
	profile_id: int
	business_name: str
	badge: NetworkBadge
	pitch: str
	domain: str


def normalize_company_domain(website: str = "", email: str = "") -> str:
	domain = get_domain(website) if website else ""
	if domain:
		return domain.lower()
	if email and "@" in email:
		return email.split("@", 1)[1].lower().strip()
	return ""


def _badge_for_profile(profile: BusinessProfile) -> NetworkBadge:
	raw = (profile.network_badge or "verified").strip().lower()
	if raw == "sponsored":
		return "sponsored"
	return "verified"


def _pitch_for_profile(profile: BusinessProfile) -> str:
	value = (profile.value_proposition or profile.what_we_sell or "").strip()
	if value:
		return value[:240]
	return f"{profile.business_name} is a Scouter network member."


def load_network_directory(db: Session) -> dict[str, NetworkMemberMatch]:
	profiles = db.scalars(
		select(BusinessProfile).where(
			BusinessProfile.is_network_member.is_(True),
			BusinessProfile.website.is_not(None),
		)
	).all()
	directory: dict[str, NetworkMemberMatch] = {}
	for profile in profiles:
		domain = normalize_company_domain(profile.website or "")
		if not domain or domain in directory:
			continue
		directory[domain] = NetworkMemberMatch(
			profile_id=profile.id,
			business_name=profile.business_name,
			badge=_badge_for_profile(profile),
			pitch=_pitch_for_profile(profile),
			domain=domain,
		)
	return directory


def match_lead(
	db: Session,
	*,
	website: str = "",
	email: str = "",
	directory: dict[str, NetworkMemberMatch] | None = None,
) -> NetworkMemberMatch | None:
	domain = normalize_company_domain(website, email)
	if not domain:
		return None
	if directory is None:
		directory = load_network_directory(db)
	return directory.get(domain)


def match_lead_row(
	db: Session,
	lead: Lead,
	*,
	directory: dict[str, NetworkMemberMatch] | None = None,
) -> NetworkMemberMatch | None:
	return match_lead(
		db,
		website=lead.website or "",
		email=lead.email or "",
		directory=directory,
	)


def enrich_lead_dict(db: Session, lead: Lead, *, directory: dict[str, NetworkMemberMatch] | None = None) -> dict:
	data = {
		"id": lead.id,
		"mission_id": lead.mission_id,
		"name": lead.name,
		"description": lead.description,
		"location": lead.location,
		"website": lead.website,
		"email": lead.email,
		"phone": lead.phone,
		"score": lead.score,
		"status": lead.status,
		"tracking_status": lead.tracking_status,
		"why": list(lead.why or []),
		"missing": list(lead.missing or []),
		"recommended": list(lead.recommended or []),
		"evidence": list(lead.evidence or []),
		"sources_scanned": list(lead.sources_scanned or []),
		"created_at": lead.created_at,
		"updated_at": lead.updated_at,
		"is_network_member": False,
		"network_member_name": None,
		"network_badge": None,
		"network_pitch": None,
	}
	match = match_lead_row(db, lead, directory=directory)
	if match is None:
		return data
	data["is_network_member"] = True
	data["network_member_name"] = match.business_name
	data["network_badge"] = match.badge
	data["network_pitch"] = match.pitch
	return data
