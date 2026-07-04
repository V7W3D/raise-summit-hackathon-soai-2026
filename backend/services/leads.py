from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.leads import Lead
from models.schemas.leads import LeadCreate, LeadUpdate


def list_leads(db: Session, *, mission_id: int | None = None) -> list[Lead]:
	stmt = select(Lead).order_by(Lead.score.desc())
	if mission_id is not None:
		stmt = stmt.where(Lead.mission_id == mission_id)
	return list(db.scalars(stmt).all())


def get_lead(db: Session, lead_id: int) -> Lead | None:
	return db.get(Lead, lead_id)


def create_lead(db: Session, payload: LeadCreate) -> Lead:
	lead = Lead(**payload.model_dump())
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
