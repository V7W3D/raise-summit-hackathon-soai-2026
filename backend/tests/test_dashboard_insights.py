from __future__ import annotations

from fastapi.testclient import TestClient


def _create_leads(client: TestClient, mission_id: int, total: int, qualified: int) -> None:
	for i in range(total):
		score = 80 if i < qualified else 50
		res = client.post(
			"/leads",
			json={
				"mission_id": mission_id,
				"name": f"Lead {mission_id}-{i}",
				"description": "Test lead",
				"location": "Lyon, France",
				"website": f"lead{mission_id}{i}.fr",
				"score": score,
				"score_label": "High fit" if score >= 75 else "Low fit",
				"score_tone": "green" if score >= 75 else "blue",
				"category": "high_fit" if score >= 75 else "promising",
				"why": ["Test reason"],
				"missing": [],
				"recommended": [],
			},
		)
		assert res.status_code == 201, res.text


def test_home_dashboard_empty(client: TestClient) -> None:
	res = client.get("/home/dashboard")
	assert res.status_code == 200
	body = res.json()
	assert body["user"]["name"] == "Azzedine"
	assert body["greeting"].startswith("Good morning, Azzedine")
	assert len(body["next_best_actions"]) == 5
	assert len(body["stats"]) == 6


def test_home_dashboard_aggregates(client: TestClient) -> None:
	m1 = client.post("/missions", json={"name": "M1", "status": "Active"}).json()
	m2 = client.post("/missions", json={"name": "M2", "status": "Active"}).json()
	_create_leads(client, m1["id"], total=25, qualified=9)
	_create_leads(client, m2["id"], total=18, qualified=6)

	body = client.get("/home/dashboard").json()
	stats = {s["label"]: s["value"] for s in body["stats"]}
	assert stats["Missions active"] == "2"
	assert stats["New leads found this week"] == "43"
	assert stats["Qualified leads"] == "15"
	assert len(body["recent_missions"]) == 2


def test_insights_report(client: TestClient) -> None:
	res = client.get("/insights")
	assert res.status_code == 200
	body = res.json()
	assert len(body["performance"]) == 7
	assert len(body["funnel_stages"]) == 6
	assert body["mission_name"] == "Construction Clients – Lyon"


def test_insights_named_mission(client: TestClient) -> None:
	mission = client.post("/missions", json={"name": "Seafood Suppliers – Paris"}).json()
	body = client.get("/insights", params={"mission_id": mission["id"]}).json()
	assert body["mission_name"] == "Seafood Suppliers – Paris"
	assert body["mission_id"] == mission["id"]
