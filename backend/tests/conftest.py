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
from models.clients.users import User


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
