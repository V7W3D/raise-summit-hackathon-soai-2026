from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from database.dependencies import DbSession
from models.schemas.leads import LeadCreate, LeadRead, LeadUpdate
from services import leads as lead_service
from services import network_members as network_member_service

router = APIRouter(prefix="/leads", tags=["leads"])


def _require_lead(db: DbSession, lead_id: int):
	lead = lead_service.get_lead(db, lead_id)
	if lead is None:
		raise HTTPException(status_code=404, detail="Lead not found")
	return lead


def _to_lead_read(db: DbSession, lead, *, directory=None) -> LeadRead:
	return LeadRead.model_validate(
		network_member_service.enrich_lead_dict(db, lead, directory=directory)
	)


@router.get("", response_model=list[LeadRead])
def list_leads(
	db: DbSession,
	mission_id: int | None = Query(default=None),
):
	leads = lead_service.list_leads(db, mission_id=mission_id)
	directory = network_member_service.load_network_directory(db)
	return [_to_lead_read(db, lead, directory=directory) for lead in leads]


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: DbSession):
	lead = lead_service.create_lead(db, payload)
	return _to_lead_read(db, lead)


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: int, db: DbSession):
	lead = _require_lead(db, lead_id)
	return _to_lead_read(db, lead)


@router.patch("/{lead_id}", response_model=LeadRead)
def update_lead(lead_id: int, payload: LeadUpdate, db: DbSession):
	lead = _require_lead(db, lead_id)
	updated = lead_service.update_lead(db, lead, payload)
	return _to_lead_read(db, updated)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: DbSession):
	lead = _require_lead(db, lead_id)
	lead_service.delete_lead(db, lead)
