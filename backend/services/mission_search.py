"""Enqueue and execute background search-agent runs for missions."""

from __future__ import annotations

import logging
import threading
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from database.session import SessionLocal
from models.clients.missions import Mission
from services import search_agent as search_agent_service
from services import search_progress

logger = logging.getLogger(__name__)

# Searches using Tavily typically finish in under a minute. If still
# "running" after this window, the worker likely died or never started.
STALE_SEARCH_AFTER = timedelta(seconds=90)


class MissionSearchAlreadyRunningError(Exception):
	"""Raised when a search is already in progress for the mission."""


def _utcnow() -> datetime:
	return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
	if value.tzinfo is None:
		return value.replace(tzinfo=timezone.utc)
	return value.astimezone(timezone.utc)


def is_search_stale(mission: Mission) -> bool:
	if mission.search_status != "running":
		return False
	return _utcnow() - _as_utc(mission.updated_at) > STALE_SEARCH_AFTER


def recover_stale_search(db: Session, mission: Mission) -> Mission:
	"""Mark a long-running search as failed so the user can retry."""
	if not is_search_stale(mission):
		return mission
	logger.warning(
		"Recovering stale search for mission_id=%s (stuck since %s)",
		mission.id,
		mission.updated_at,
	)
	mission.search_status = "failed"
	db.commit()
	db.refresh(mission)
	return mission


def recover_stale_searches(db: Session, missions: list[Mission]) -> list[Mission]:
	changed = False
	for mission in missions:
		if is_search_stale(mission):
			recover_stale_search(db, mission)
			changed = True
	return missions


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
		if is_search_stale(mission):
			recover_stale_search(db, mission)
		else:
			raise MissionSearchAlreadyRunningError(
				f"Search is already running for mission {mission_id}"
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
	import os

	provider = os.environ.get("SEARCH_PROVIDER", "").strip() or "unset"
	logger.info(
		"Starting mission search mission_id=%s SEARCH_PROVIDER=%s",
		mission_id,
		provider,
	)

	final_status = "ready"
	lead_count = 0
	from search_agent.search_profiles import search_mode_label
	from services.missions import get_mission

	mission = get_mission(db, mission_id)
	mode_label = search_mode_label(mission.mission_priority if mission else None)
	search_progress.start_progress(mission_id, search_mode=mode_label)

	def on_progress(fields: dict) -> None:
		search_progress.update_progress(mission_id, **fields)

	try:
		result = search_agent_service.run_search_for_mission(
			db, mission_id, user_id=user_id, progress_callback=on_progress
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
		search_progress.finish_progress(mission_id, failed=final_status == "failed")
		_set_search_status(db, mission_id, final_status)


def enqueue_mission_search(mission_id: int, user_id: int) -> None:
	"""Run the search agent in a background thread (no Celery required)."""
	thread = threading.Thread(
		target=execute_mission_search,
		args=(mission_id, user_id),
		daemon=True,
		name=f"mission-search-{mission_id}",
	)
	thread.start()
	logger.info("Started background search thread for mission_id=%s", mission_id)


def _set_search_status(db: Session, mission_id: int, status: str) -> None:
	mission = db.get(Mission, mission_id)
	if mission is None:
		return
	mission.search_status = status
	db.commit()
