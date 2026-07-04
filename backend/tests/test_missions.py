from __future__ import annotations

from fastapi.testclient import TestClient


def _create_mission(client: TestClient, **overrides) -> dict:
	payload = {
		"name": "Construction Clients – Lyon",
		"target": "Target: small service businesses",
		"mission_type": "Clients",
		"location": "Lyon, France",
		"status": "Active",
		"icon": "building",
		"color": "blue",
	}
	payload.update(overrides)
	res = client.post("/missions", json=payload)
	assert res.status_code == 201, res.text
	return res.json()


def test_create_and_list_missions(client: TestClient) -> None:
	created = _create_mission(client)
	assert created["id"] > 0
	assert created["name"] == "Construction Clients – Lyon"
	assert created["progress"] == 0

	res = client.get("/missions")
	assert res.status_code == 200
	missions = res.json()
	assert len(missions) == 1
	assert missions[0]["id"] == created["id"]


def test_get_mission_404(client: TestClient) -> None:
	assert client.get("/missions/999").status_code == 404


def test_update_mission(client: TestClient) -> None:
	created = _create_mission(client)
	res = client.patch(
		f"/missions/{created['id']}",
		json={"status": "Paused", "progress": 42},
	)
	assert res.status_code == 200
	body = res.json()
	assert body["status"] == "Paused"
	assert body["progress"] == 42


def test_filter_by_status(client: TestClient) -> None:
	_create_mission(client, name="Active One", status="Active")
	_create_mission(client, name="Draft One", status="Draft")

	res = client.get("/missions", params={"status": "Draft"})
	assert res.status_code == 200
	names = [m["name"] for m in res.json()]
	assert names == ["Draft One"]


def test_delete_mission(client: TestClient) -> None:
	created = _create_mission(client)
	assert client.delete(f"/missions/{created['id']}").status_code == 204
	assert client.get(f"/missions/{created['id']}").status_code == 404
