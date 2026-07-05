from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient


def test_target_keywords_endpoint(client: TestClient) -> None:
	with patch(
		"routers.missions.generate_target_keywords",
		return_value=(["Plumber", "Electrician", "Garage", "Clinic", "Locksmith"], "llm"),
	):
		res = client.get("/missions/target-keywords")

	assert res.status_code == 200, res.text
	body = res.json()
	assert len(body["keywords"]) == 5
	assert body["keywords"][0] == "Plumber"
	assert body["source"] == "llm"
