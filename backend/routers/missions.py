from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from database.dependencies import DbSession
from models.schemas.missions import MissionCreate, MissionRead, MissionUpdate
from services import missions as mission_service
from services import users as user_service

router = APIRouter(prefix="/missions", tags=["missions"])


@router.get("", response_model=list[MissionRead])
def list_missions(db: DbSession, status: str | None = Query(default=None)):
	return mission_service.list_missions(db, status=status)


@router.post("", response_model=MissionRead, status_code=status.HTTP_201_CREATED)
def create_mission(payload: MissionCreate, db: DbSession):
	user = user_service.get_or_create_default_user(db)
	return mission_service.create_mission(db, payload, user_id=user.id)


@router.get("/{mission_id}", response_model=MissionRead)
def get_mission(mission_id: int, db: DbSession):
	mission = mission_service.get_mission(db, mission_id)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	return mission


@router.patch("/{mission_id}", response_model=MissionRead)
def update_mission(mission_id: int, payload: MissionUpdate, db: DbSession):
	mission = mission_service.get_mission(db, mission_id)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	return mission_service.update_mission(db, mission, payload)


@router.delete("/{mission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mission(mission_id: int, db: DbSession):
	mission = mission_service.get_mission(db, mission_id)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	mission_service.delete_mission(db, mission)
