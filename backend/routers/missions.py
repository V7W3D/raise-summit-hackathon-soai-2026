from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from database.dependencies import DbSession
from models.schemas.missions import MissionCreate, MissionRead, MissionUpdate
from services import missions as mission_service
from services import search_agent as search_agent_service
from services import users as user_service
from services.business_profiles import BusinessProfileNotFoundError
from services.mission_search import (
	MissionSearchAlreadyRunningError,
	MissionSearchNotActivatedError,
	start_mission_search,
)
from search_agent.errors import ProviderNotConfiguredError

router = APIRouter(prefix="/missions", tags=["missions"])


def _require_default_user(db: DbSession):
	user = user_service.get_default_user(db)
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Database not seeded. Run: python -m database.seed",
		)
	return user


@router.get("", response_model=list[MissionRead])
def list_missions(db: DbSession, is_archived: bool = Query(default=False)):
	return mission_service.list_missions(db, is_archived=is_archived)


@router.post("", response_model=MissionRead, status_code=status.HTTP_201_CREATED)
def create_mission(payload: MissionCreate, db: DbSession):
	user = _require_default_user(db)
	return mission_service.create_mission(db, payload, user_id=user.id)


@router.post("/{mission_id}/search", response_model=MissionRead)
def run_mission_search(mission_id: int, db: DbSession):
	user = _require_default_user(db)
	mission = mission_service.get_mission(db, mission_id)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	try:
		return start_mission_search(db, mission_id, user_id=user.id)
	except MissionSearchAlreadyRunningError as exc:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail=str(exc),
		) from None
	except MissionSearchNotActivatedError as exc:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail=str(exc),
		) from None
	except BusinessProfileNotFoundError:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
			detail=(
				"Business profile required before running search. "
				"Run: python -m database.seed"
			),
		) from None
	except ProviderNotConfiguredError as exc:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail=str(exc),
		) from None


@router.post("/{mission_id}/search")
def search_mission(mission_id: int, db: DbSession):
	"""Re-run the search agent for a mission and persist newly found leads."""
	user = _require_default_user(db)
	try:
		result = search_agent_service.run_search_for_mission(
			db, mission_id, user_id=user.id
		)
	except BusinessProfileNotFoundError:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
			detail=(
				"Business profile required before running search. "
				"Run: python -m database.seed"
			),
		) from None
	except ProviderNotConfiguredError as exc:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail=str(exc),
		) from None
	if result is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	output, leads = result
	return {
		"missionId": mission_id,
		"agentStatus": output.status,
		"leadsCreated": len(leads),
	}


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
	mission = mission_service.get_mission(db, mission_id, active_only=False)
	if mission is None:
		raise HTTPException(status_code=404, detail="Mission not found")
	mission_service.delete_mission(db, mission)
