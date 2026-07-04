from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
	res = client.get("/health")
	assert res.status_code == 200
	assert res.json() == {"status": "ok"}


def test_root(client: TestClient) -> None:
	res = client.get("/")
	assert res.status_code == 200
	assert "message" in res.json()
