from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from models.clients.missions import Mission
from services import search_agent as search_agent_service
from services.mission_search import (
	MissionSearchAlreadyRunningError,
	_execute_mission_search,
	start_mission_search,
)
from tests.search_agent.support.fakes import FakePageFetcher, FakeSearchProvider
from tests.test_search_agent_service import LYON_MISSION, _create_mission


@pytest.fixture(autouse=True)
def _inject_fake_search(monkeypatch: pytest.MonkeyPatch):
	original = search_agent_service.run_search_for_mission

	def _wrapped(db, mission_id, **kwargs):
		kwargs.setdefault("provider", FakeSearchProvider())
		kwargs.setdefault("fetcher", FakePageFetcher())
		return original(db, mission_id, **kwargs)

	monkeypatch.setattr(search_agent_service, "run_search_for_mission", _wrapped)


def test_execute_mission_search_sets_ready(db_session: Session) -> None:
	mission = _create_mission(db_session)
	mission.search_status = "running"
	db_session.commit()

	_execute_mission_search(db_session, mission.id, user_id=1)

	db_session.refresh(mission)
	assert mission.search_status == "ready"


def test_start_mission_search_sets_running_and_enqueues(
	db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
	calls: list[tuple[int, int]] = []

	def fake_enqueue(mission_id: int, user_id: int) -> None:
		calls.append((mission_id, user_id))

	monkeypatch.setattr("services.mission_search.enqueue_mission_search", fake_enqueue)

	mission = _create_mission(db_session)
	result = start_mission_search(db_session, mission.id, user_id=1)

	assert result.search_status == "running"
	assert calls == [(mission.id, 1)]


def test_start_mission_search_rejects_already_running(db_session: Session) -> None:
	mission = _create_mission(db_session)
	mission.search_status = "running"
	db_session.commit()

	with pytest.raises(MissionSearchAlreadyRunningError):
		start_mission_search(db_session, mission.id, user_id=1)


def test_enqueue_mission_search_dispatches_task(monkeypatch: pytest.MonkeyPatch) -> None:
	calls: list[tuple[int, int]] = []

	def fake_delay(mission_id: int, user_id: int) -> None:
		calls.append((mission_id, user_id))

	import tasks.mission_search as mission_search_tasks

	monkeypatch.setattr(mission_search_tasks.run_mission_search_task, "delay", fake_delay)

	from services.mission_search import enqueue_mission_search

	enqueue_mission_search(42, 7)
	assert calls == [(42, 7)]
