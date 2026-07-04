"""Enqueue and execute background search-agent runs for missions."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from database.session import SessionLocal
from models.clients.missions import Mission
from services import search_agent as search_agent_service

logger = logging.getLogger(__name__)


class MissionSearchAlreadyRunningError(Exception):
	"""Raised when a search is already in progress for the mission."""


class MissionSearchNotActivatedError(Exception):
	"""Raised when the mission must be updated before the agent can run again."""


def start_mission_search(db: Session, mission_id: int, *, user_id: int) -> Mission:
	"""Validate prerequisites, mark the mission as running, and enqueue search."""
	from services.business_profiles import (
		BusinessProfileNotFoundError,
		get_business_profile_for_user,
	)
	from services.missions import get_mission

	mission = get_mission(db, mission_id)
	if mission is None:
		raise ValueError("Mission not found")

	if mission.search_status == "running":
		raise MissionSearchAlreadyRunningError(
			f"Search is already running for mission {mission_id}"
		)

	if not mission.search_activated:
		raise MissionSearchNotActivatedError(
			f"Search is not activated for mission {mission_id}. Update the mission to run again."
		)

	if get_business_profile_for_user(db, user_id) is None:
		raise BusinessProfileNotFoundError(
			"Business profile not found for this user or mission"
		)

	search_agent_service.resolve_provider_options()
	mission.search_status = "running"
	db.commit()
	db.refresh(mission)
	enqueue_mission_search(mission.id, user_id)
	db.refresh(mission)
	return mission


def execute_mission_search(mission_id: int, user_id: int) -> None:
	"""Run the search agent for a mission and persist the final search status."""
	db = SessionLocal()
	try:
		_execute_mission_search(db, mission_id, user_id)
	finally:
		db.close()


def _execute_mission_search(db: Session, mission_id: int, user_id: int) -> None:
	final_status = "ready"
	lead_count = 0
	try:
		result = search_agent_service.run_search_for_mission(
			db, mission_id, user_id=user_id
		)
		if result is None:
			final_status = "failed"
		else:
			_output, leads = result
			lead_count = len(leads)
			logger.info(
				"Mission search finished for mission_id=%s: %s leads persisted",
				mission_id,
				lead_count,
			)
	except Exception:
		final_status = "failed"
		logger.exception("Search agent run failed for mission_id=%s", mission_id)
	finally:
		_set_search_status(db, mission_id, final_status)


def enqueue_mission_search(mission_id: int, user_id: int) -> None:
	"""Dispatch a Celery task to run the search agent for the given mission."""
	from tasks.mission_search import run_mission_search_task

	run_mission_search_task.delay(mission_id, user_id)


def _set_search_status(db: Session, mission_id: int, status: str) -> None:
	mission = db.get(Mission, mission_id)
	if mission is None:
		return
	mission.search_status = status
	mission.search_activated = False
	db.commit()
