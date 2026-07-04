from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_business_profile(client: TestClient) -> None:
	res = client.get("/business-profile")
	assert res.status_code == 200
	body = res.json()
	assert body["business_name"] == "CallPilot AI"
	assert body["business_type"] == "B2B SaaS"
	assert body["what_we_sell"]
	assert body["target_geographies"] == ["France"]
