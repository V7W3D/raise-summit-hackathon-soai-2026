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
		"score_label": "High fit",
		"score_tone": "green",
		"category": "high_fit",
		"why": ["Local plumbing company in Lyon", "Emergency service mentioned"],
		"missing": ["No named operations manager"],
		"recommended": ["Short email + phone follow-up"],
	}
	payload.update(overrides)
	res = client.post("/leads", json=payload)
	assert res.status_code == 201, res.text
	return res.json()


def test_create_lead_generates_slug(client: TestClient) -> None:
	mission_id = _create_mission(client)
	lead = _create_lead(client, mission_id)
	assert lead["slug"] == "rhone-plomberie"
	assert lead["why"] == ["Local plumbing company in Lyon", "Emergency service mentioned"]


def test_get_lead_by_slug(client: TestClient) -> None:
	mission_id = _create_mission(client)
	_create_lead(client, mission_id)
	res = client.get("/leads/rhone-plomberie")
	assert res.status_code == 200
	assert res.json()["name"] == "Rhône Plomberie"


def test_slug_uniqueness(client: TestClient) -> None:
	mission_id = _create_mission(client)
	first = _create_lead(client, mission_id)
	second = _create_lead(client, mission_id)
	assert first["slug"] == "rhone-plomberie"
	assert second["slug"] == "rhone-plomberie-2"


def test_list_leads_filters(client: TestClient) -> None:
	mission_id = _create_mission(client)
	_create_lead(client, mission_id, name="High Fit Co", category="high_fit", score=90)
	_create_lead(client, mission_id, name="Review Co", category="needs_verification", score=61)

	all_leads = client.get("/leads", params={"mission_id": mission_id}).json()
	assert len(all_leads) == 2
	# Ordered by score desc
	assert all_leads[0]["name"] == "High Fit Co"

	review = client.get("/leads", params={"category": "needs_verification"}).json()
	assert [lead["name"] for lead in review] == ["Review Co"]


def test_update_lead(client: TestClient) -> None:
	mission_id = _create_mission(client)
	_create_lead(client, mission_id)
	res = client.patch("/leads/rhone-plomberie", json={"status": "Rejected", "category": "rejected"})
	assert res.status_code == 200
	assert res.json()["status"] == "Rejected"


def test_lead_404(client: TestClient) -> None:
	assert client.get("/leads/nope").status_code == 404
