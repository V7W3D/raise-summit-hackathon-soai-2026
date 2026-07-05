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


def test_update_business_profile(client: TestClient) -> None:
	res = client.patch(
		"/business-profile",
		json={
			"business_name": "CallPilot AI",
			"business_type": "B2B SaaS platform",
			"what_we_sell": "AI phone receptionist",
			"target_geographies": ["France", "Belgium"],
			"ideal_customers": ["local service businesses"],
			"languages": ["fr", "en"],
		},
	)
	assert res.status_code == 200
	body = res.json()
	assert body["business_type"] == "B2B SaaS platform"
	assert body["target_geographies"] == ["France", "Belgium"]
	assert body["languages"] == ["fr", "en"]
