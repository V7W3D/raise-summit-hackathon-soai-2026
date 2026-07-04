from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import models.clients  # noqa: F401  (register ORM models)
from database.base import Base
from database.dependencies import get_db
from main import app
from models.clients.business_profiles import BusinessProfile
from models.clients.users import User
from search_agent.schemas import SearchAgentOutput, SearchPlan


@pytest.fixture(autouse=True)
def _stub_mission_search_on_create(request: pytest.FixtureRequest, monkeypatch: pytest.MonkeyPatch):
	"""Avoid running the full search pipeline on every POST /missions in unrelated tests."""
	if request.node.path and "test_search_agent_service.py" in str(request.node.path):
		return

	def _noop_run_search(db: Session, mission_id: int, **kwargs):
		return SearchAgentOutput(
			request_id="req_stub",
			mission_id=str(mission_id),
			status="success",
			search_plan=SearchPlan(interpreted_goal="stub"),
		), []

	monkeypatch.setattr(
		"services.search_agent.run_search_for_mission",
		_noop_run_search,
	)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
	# In-memory SQLite shared across connections within the test.
	engine = create_engine(
		"sqlite://",
		connect_args={"check_same_thread": False},
		poolclass=StaticPool,
	)
	Base.metadata.create_all(bind=engine)
	TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
	session = TestingSessionLocal()
	session.add(
		User(
			name="Azzedine",
			email="azzedine@prospectpath.com",
		)
	)
	session.flush()
	session.add(
		BusinessProfile(
			user_id=1,
			business_name="CallPilot AI",
			business_type="B2B SaaS",
			what_we_sell="AI phone receptionist for small service businesses",
			target_geographies=["France"],
			ideal_customers=["small local service companies that receive many calls"],
			bad_fit_customers=[
				"very large enterprises",
				"businesses with no phone-based workflow",
			],
			languages=["fr"],
		)
	)
	session.commit()
	try:
		yield session
	finally:
		session.close()
		Base.metadata.drop_all(bind=engine)
		engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
	def override_get_db() -> Generator[Session, None, None]:
		yield db_session

	app.dependency_overrides[get_db] = override_get_db
	with TestClient(app) as test_client:
		yield test_client
	app.dependency_overrides.clear()
