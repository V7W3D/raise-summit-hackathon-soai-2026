from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from database.dependencies import DbSession
from models.schemas.leads import LeadCreate, LeadRead, LeadUpdate
from services import leads as lead_service

router = APIRouter(prefix="/leads", tags=["leads"])


def _require_lead(db: DbSession, lead_id: int):
	lead = lead_service.get_lead(db, lead_id)
	if lead is None:
		raise HTTPException(status_code=404, detail="Lead not found")
	return lead


@router.get("", response_model=list[LeadRead])
def list_leads(
	db: DbSession,
	mission_id: int | None = Query(default=None),
):
	return lead_service.list_leads(db, mission_id=mission_id)


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: DbSession):
	return lead_service.create_lead(db, payload)


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: int, db: DbSession):
	return _require_lead(db, lead_id)


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(lead_id: int, payload: LeadUpdate, db: DbSession):
	lead = _require_lead(db, lead_id)
	return lead_service.update_lead(db, lead, payload)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: DbSession):
	lead = _require_lead(db, lead_id)
	lead_service.delete_lead(db, lead)
