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
	m1 = client.post("/missions", json={"name": "M1"}).json()
	m2 = client.post("/missions", json={"name": "M2"}).json()
	_create_leads(client, m1["id"], total=25, qualified=9)
	_create_leads(client, m2["id"], total=18, qualified=6)

	body = client.get("/home/dashboard").json()
	stats = {s["label"]: s["value"] for s in body["stats"]}
	assert stats["Missions active"] == "2"
	assert stats["New leads found this week"] == "43"
	assert stats["Qualified leads"] == "15"
	assert len(body["recent_missions"]) == 2
