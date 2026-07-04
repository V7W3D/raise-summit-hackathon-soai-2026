from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.missions import Mission
from models.clients.user_mission_links import UserMissionLink
from models.schemas.missions import MissionCreate, MissionUpdate

# Status values that count as "active" for dashboards.
ACTIVE_STATUSES = {"Active"}


def list_missions(db: Session, *, status: str | None = None) -> list[Mission]:
	stmt = select(Mission).order_by(Mission.last_activity_at.desc())
	if status:
		stmt = stmt.where(Mission.status == status)
	return list(db.scalars(stmt).all())


def get_mission(db: Session, mission_id: int) -> Mission | None:
	return db.get(Mission, mission_id)


def create_mission(
	db: Session, payload: MissionCreate, *, user_id: int, run_search: bool = True
) -> Mission:
	mission = Mission(**payload.model_dump())
	db.add(mission)
	db.flush()
	db.add(UserMissionLink(user_id=user_id, mission_id=mission.id))
	db.commit()
	db.refresh(mission)
	if run_search:
		from services import search_agent as search_agent_service

		search_agent_service.run_search_for_mission(db, mission.id, user_id=user_id)
	return mission


def update_mission(db: Session, mission: Mission, payload: MissionUpdate) -> Mission:
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(mission, field, value)
	db.commit()
	db.refresh(mission)
	return mission


def delete_mission(db: Session, mission: Mission) -> None:
	db.delete(mission)
	db.commit()
