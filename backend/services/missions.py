from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.missions import Mission
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


def create_mission(db: Session, payload: MissionCreate, *, user_id: int) -> Mission:
	mission = Mission(**payload.model_dump(), user_id=user_id)
	db.add(mission)
	db.commit()
	db.refresh(mission)
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
