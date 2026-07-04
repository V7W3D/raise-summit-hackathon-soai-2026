from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from models.clients.missions import Mission


def _create_mission(client: TestClient, **overrides) -> dict:
	payload = {
		"name": "Construction Clients – Lyon",
		"target": "Target: small service businesses",
		"location": "Lyon, France",
		"description": "Find small construction service businesses in Lyon.",
		"target_industry": "construction",
		"language": "fr",
	}
	payload.update(overrides)
	res = client.post("/missions", json=payload)
	assert res.status_code == 201, res.text
	return res.json()


def test_create_mission_defaults_description_from_name_and_target(client: TestClient) -> None:
	res = client.post(
		"/missions",
		json={
			"name": "Construction Clients – Lyon",
			"target": "Target: small service businesses",
			"location": "Lyon, France",
		},
	)
	assert res.status_code == 201, res.text
	body = res.json()
	assert body["description"] == (
		"Construction Clients – Lyon: Target: small service businesses"
	)


def test_create_and_list_missions(client: TestClient) -> None:
	created = _create_mission(client)
	assert created["id"] > 0
	assert created["name"] == "Construction Clients – Lyon"
	assert created["progress"] == 0
	assert created["is_archived"] is False
	assert created["search_status"] == "ready"
	assert created["search_activated"] is True

	res = client.get("/missions")
	assert res.status_code == 200
	missions = res.json()
	assert len(missions) == 1
	assert missions[0]["id"] == created["id"]


def test_list_archived_missions(client: TestClient) -> None:
	active = _create_mission(client, name="Active mission")
	archived = _create_mission(client, name="Archived mission")
	client.patch(f"/missions/{archived['id']}", json={"is_archived": True})

	active_res = client.get("/missions", params={"is_archived": False})
	assert active_res.status_code == 200
	assert [m["name"] for m in active_res.json()] == ["Active mission"]

	archived_res = client.get("/missions", params={"is_archived": True})
	assert archived_res.status_code == 200
	assert [m["name"] for m in archived_res.json()] == ["Archived mission"]


def test_get_archived_mission_returns_404(client: TestClient) -> None:
	created = _create_mission(client)
	client.patch(f"/missions/{created['id']}", json={"is_archived": True})
	assert client.get(f"/missions/{created['id']}").status_code == 404


def test_get_mission_404(client: TestClient) -> None:
	assert client.get("/missions/999").status_code == 404


def test_update_mission(client: TestClient) -> None:
	created = _create_mission(client)
	res = client.patch(
		f"/missions/{created['id']}",
		json={"progress": 42},
	)
	assert res.status_code == 200
	body = res.json()
	assert body["progress"] == 42


def test_delete_mission(client: TestClient) -> None:
	created = _create_mission(client)
	assert client.delete(f"/missions/{created['id']}").status_code == 204
	assert client.get(f"/missions/{created['id']}").status_code == 404


def test_start_mission_search_returns_running(client: TestClient) -> None:
	created = _create_mission(client)
	assert created["search_status"] == "ready"

	res = client.post(f"/missions/{created['id']}/search")
	assert res.status_code == 200, res.text
	assert res.json()["search_status"] == "running"


def test_start_mission_search_conflict_when_already_running(client: TestClient) -> None:
	created = _create_mission(client)
	client.post(f"/missions/{created['id']}/search")

	res = client.post(f"/missions/{created['id']}/search")
	assert res.status_code == 409


def test_start_mission_search_conflict_when_not_activated(
	client: TestClient, db_session: Session
) -> None:
	created = _create_mission(client)
	client.post(f"/missions/{created['id']}/search")
	mission = db_session.get(Mission, created["id"])
	assert mission is not None
	mission.search_status = "ready"
	mission.search_activated = False
	db_session.commit()

	res = client.post(f"/missions/{created['id']}/search")
	assert res.status_code == 409


def test_update_mission_reactivates_search(client: TestClient, db_session: Session) -> None:
	created = _create_mission(client)
	client.post(f"/missions/{created['id']}/search")
	mission = db_session.get(Mission, created["id"])
	assert mission is not None
	mission.search_status = "ready"
	mission.search_activated = False
	db_session.commit()

	res = client.patch(f"/missions/{created['id']}", json={"progress": 10})
	assert res.status_code == 200
	assert res.json()["search_activated"] is True

	search_res = client.post(f"/missions/{created['id']}/search")
	assert search_res.status_code == 200


def test_delete_mission_cascades_leads(client: TestClient) -> None:
	created = _create_mission(client)
	mission_id = created["id"]

	res = client.post(
		"/leads",
		json={
			"mission_id": mission_id,
			"name": "Rhône Plomberie",
			"description": "Local emergency plumbing company",
			"location": "Lyon, France",
			"website": "rhoneplomberie.fr",
			"score": 84,
		},
	)
	assert res.status_code == 201, res.text

	leads = client.get("/leads", params={"mission_id": mission_id}).json()
	assert len(leads) == 1

	assert client.delete(f"/missions/{mission_id}").status_code == 204
	assert client.get("/leads", params={"mission_id": mission_id}).json() == []
