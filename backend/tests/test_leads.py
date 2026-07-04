from __future__ import annotations

from fastapi.testclient import TestClient


def _create_mission(client: TestClient) -> int:
	res = client.post(
		"/missions",
		json={"name": "Construction Clients – Lyon", "status": "Active"},
	)
	assert res.status_code == 201, res.text
	return res.json()["id"]


def _create_lead(client: TestClient, mission_id: int, **overrides) -> dict:
	payload = {
		"mission_id": mission_id,
		"name": "Rhône Plomberie",
		"description": "Local emergency plumbing and repair company",
		"location": "Lyon, France",
		"website": "rhoneplomberie.fr",
		"score": 84,
		"why": ["Local plumbing company in Lyon", "Emergency service mentioned"],
		"missing": ["No named operations manager"],
		"recommended": ["Short email + phone follow-up"],
	}
	payload.update(overrides)
	res = client.post("/leads", json=payload)
	assert res.status_code == 201, res.text
	return res.json()


def test_create_lead_returns_id(client: TestClient) -> None:
	mission_id = _create_mission(client)
	lead = _create_lead(client, mission_id)
	assert isinstance(lead["id"], int)
	assert lead["description"] == "Local emergency plumbing and repair company"
	assert lead["why"] == ["Local plumbing company in Lyon", "Emergency service mentioned"]


def test_get_lead_by_id(client: TestClient) -> None:
	mission_id = _create_mission(client)
	created = _create_lead(client, mission_id)
	res = client.get(f"/leads/{created['id']}")
	assert res.status_code == 200
	assert res.json()["name"] == "Rhône Plomberie"


def test_duplicate_names_get_distinct_ids(client: TestClient) -> None:
	mission_id = _create_mission(client)
	first = _create_lead(client, mission_id)
	second = _create_lead(client, mission_id)
	assert first["id"] != second["id"]


def test_list_leads_filters(client: TestClient) -> None:
	mission_id = _create_mission(client)
	_create_lead(client, mission_id, name="High Fit Co", score=90)
	_create_lead(client, mission_id, name="Review Co", score=61)

	all_leads = client.get("/leads", params={"mission_id": mission_id}).json()
	assert len(all_leads) == 2
	# Ordered by score desc
	assert all_leads[0]["name"] == "High Fit Co"


def test_update_lead(client: TestClient) -> None:
	mission_id = _create_mission(client)
	created = _create_lead(client, mission_id)
	res = client.patch(f"/leads/{created['id']}", json={"score": 90, "description": "Updated"})
	assert res.status_code == 200
	assert res.json()["score"] == 90
	assert res.json()["description"] == "Updated"


def test_lead_404(client: TestClient) -> None:
	assert client.get("/leads/999").status_code == 404
