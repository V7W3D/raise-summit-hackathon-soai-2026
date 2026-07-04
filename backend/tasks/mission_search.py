from __future__ import annotations

import logging

from celery_app import celery_app
from services.mission_search import execute_mission_search

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.mission_search.run_mission_search")
def run_mission_search_task(mission_id: int, user_id: int) -> None:
	"""Celery entrypoint: run the search agent for a mission and update its status."""
	try:
		execute_mission_search(mission_id, user_id)
	except Exception:
		logger.exception("Mission search failed for mission_id=%s", mission_id)
