from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from database.dependencies import DbSession
from models.schemas.leads import LeadCreate, LeadRead, LeadUpdate
from services import leads as lead_service

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=list[LeadRead])
def list_leads(
	db: DbSession,
	mission_id: int | None = Query(default=None),
	category: str | None = Query(default=None),
):
	return lead_service.list_leads(db, mission_id=mission_id, category=category)


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: DbSession):
	return lead_service.create_lead(db, payload)


@router.get("/{slug}", response_model=LeadRead)
def get_lead(slug: str, db: DbSession):
	lead = lead_service.get_lead_by_slug(db, slug)
	if lead is None and slug.isdigit():
		lead = lead_service.get_lead(db, int(slug))
	if lead is None:
		raise HTTPException(status_code=404, detail="Lead not found")
	return lead


@router.patch("/{slug}", response_model=LeadRead)
def update_lead(slug: str, payload: LeadUpdate, db: DbSession):
	lead = lead_service.get_lead_by_slug(db, slug)
	if lead is None and slug.isdigit():
		lead = lead_service.get_lead(db, int(slug))
	if lead is None:
		raise HTTPException(status_code=404, detail="Lead not found")
	return lead_service.update_lead(db, lead, payload)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(slug: str, db: DbSession):
	lead = lead_service.get_lead_by_slug(db, slug)
	if lead is None and slug.isdigit():
		lead = lead_service.get_lead(db, int(slug))
	if lead is None:
		raise HTTPException(status_code=404, detail="Lead not found")
	lead_service.delete_lead(db, lead)
