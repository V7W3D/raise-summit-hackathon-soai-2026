from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.clients.missions import Mission
from models.clients.user_mission_links import UserMissionLink
from models.clients.users import User
from search_agent.fetching import MockPageFetcher
from search_agent.providers import MockSearchProvider
from services import business_profiles as business_profile_service
from services import search_agent as search_agent_service
from services.business_profiles import BusinessProfileNotFoundError
from services.leads import list_leads

LYON_MISSION = {
	"name": "Construction Clients – Lyon",
	"target": "Target: small service businesses",
	"location": "Lyon, France",
	"status": "Active",
	"goal_type": "find_clients",
	"description": (
		"Find small construction service businesses in Lyon likely to "
		"need AI call reception."
	),
	"target_industry": "construction",
	"language": "fr",
}


def _create_mission(db: Session, **overrides) -> Mission:
	user = db.scalar(select(User).limit(1))
	assert user is not None
	data = {**LYON_MISSION, **overrides}
	mission = Mission(**data, progress=0)
	db.add(mission)
	db.flush()
	db.add(UserMissionLink(user_id=user.id, mission_id=mission.id))
	db.commit()
	db.refresh(mission)
	return mission


def test_mission_to_agent_input_maps_db_fields(db_session: Session) -> None:
	mission = _create_mission(db_session)
	profile = business_profile_service.get_business_profile_for_user(db_session, 1)
	assert profile is not None
	agent_profile = business_profile_service.business_profile_to_agent(profile)
	agent_input = search_agent_service.mission_to_agent_input(
		mission, request_id="req_test", business_profile=agent_profile
	)

	assert agent_input.request_id == "req_test"
	assert agent_input.business_profile.business_name == "CallPilot AI"
	assert agent_input.mission.mission_id == str(mission.id)
	assert agent_input.mission.goal_type == "find_clients"
	assert agent_input.mission.target_location == "Lyon, France"
	assert agent_input.mission.target_industry == "construction"
	assert agent_input.mission.language == "fr"
	assert agent_input.mission.description == LYON_MISSION["description"]


def test_run_search_for_mission_persists_leads(db_session: Session) -> None:
	mission = _create_mission(db_session)

	result = search_agent_service.run_search_for_mission(
		db_session,
		mission.id,
		provider=MockSearchProvider(),
		fetcher=MockPageFetcher(),
	)
	assert result is not None

	output, leads = result
	assert output.status in {"success", "partial_success"}
	assert len(output.candidates) > 0
	assert len(leads) == len(output.candidates)
	assert all(lead.mission_id == mission.id for lead in leads)
	assert all(isinstance(lead.id, int) for lead in leads)
	assert leads[0].name
	assert 0 <= leads[0].score <= 100

	stored = list_leads(db_session, mission_id=mission.id)
	assert len(stored) == len(leads)


def test_run_search_for_mission_returns_none_for_missing_mission(
	db_session: Session,
) -> None:
	assert search_agent_service.run_search_for_mission(db_session, 999) is None


def test_run_search_for_mission_requires_business_profile(db_session: Session) -> None:
	mission = Mission(
		name="Unlinked mission",
		target="Target: test",
		location="Lyon, France",
		status="Active",
		goal_type="find_clients",
		description="Test mission without user link.",
	)
	db_session.add(mission)
	db_session.commit()

	with pytest.raises(BusinessProfileNotFoundError):
		search_agent_service.run_search_for_mission(db_session, mission.id)


def test_create_mission_runs_search_and_persists_leads(client: TestClient) -> None:
	res = client.post("/missions", json=LYON_MISSION)
	assert res.status_code == 201, res.text
	mission_id = res.json()["id"]
	assert res.json()["goal_type"] == "find_clients"
	assert res.json()["target_industry"] == "construction"

	leads = client.get("/leads", params={"mission_id": mission_id}).json()
	assert len(leads) > 0
	assert leads[0]["mission_id"] == mission_id
