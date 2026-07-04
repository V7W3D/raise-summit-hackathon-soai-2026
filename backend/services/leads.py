from __future__ import annotations

import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.leads import Lead
from models.schemas.leads import LeadCreate, LeadUpdate

# Maps the Discover tabs to stored category values.
CATEGORY_ALIASES = {
	"high_fit": "high_fit",
	"promising": "promising",
	"needs_verification": "needs_verification",
	"rejected": "rejected",
}


def _slugify(value: str) -> str:
	# Strip accents (Rhône -> Rhone) before slugifying.
	normalized = unicodedata.normalize("NFKD", value)
	ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
	slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
	return slug or "lead"


def list_leads(
	db: Session, *, mission_id: int | None = None, category: str | None = None
) -> list[Lead]:
	stmt = select(Lead).order_by(Lead.score.desc())
	if mission_id is not None:
		stmt = stmt.where(Lead.mission_id == mission_id)
	if category:
		stmt = stmt.where(Lead.category == category)
	return list(db.scalars(stmt).all())


def get_lead(db: Session, lead_id: int) -> Lead | None:
	return db.get(Lead, lead_id)


def get_lead_by_slug(db: Session, slug: str) -> Lead | None:
	return db.scalar(select(Lead).where(Lead.slug == slug))


def _unique_slug(db: Session, base: str) -> str:
	slug = base
	suffix = 2
	while get_lead_by_slug(db, slug) is not None:
		slug = f"{base}-{suffix}"
		suffix += 1
	return slug


def create_lead(db: Session, payload: LeadCreate) -> Lead:
	data = payload.model_dump()
	explicit_slug = data.pop("slug", None)
	base_slug = _slugify(explicit_slug or data["name"])
	data["slug"] = _unique_slug(db, base_slug)
	lead = Lead(**data)
	db.add(lead)
	db.commit()
	db.refresh(lead)
	return lead


def update_lead(db: Session, lead: Lead, payload: LeadUpdate) -> Lead:
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(lead, field, value)
	db.commit()
	db.refresh(lead)
	return lead


def delete_lead(db: Session, lead: Lead) -> None:
	db.delete(lead)
	db.commit()
