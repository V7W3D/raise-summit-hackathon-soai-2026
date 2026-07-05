from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from models.schemas.mission_assist import MissionAssistResponse


def test_mission_assist_uses_llm(client: TestClient) -> None:
	mock_response = MissionAssistResponse(
		target="plumber",
		target_label="Plumbers",
		related_targets=["Plumbers", "Electricians", "Locksmiths"],
		location="Lyon, France",
		buyer_roles=["Owner"],
		trigger_signals=["Missed calls"],
		must_have_filters=["Visible phone number"],
		nice_to_have_filters=["Active website"],
		negative_filters=["Franchises"],
		mission_priority="fast_wins",
		outreach_channel="phone",
		target_business_size="small",
		suggested_lead_count=25,
		reasoning="Small plumbers in Lyon likely miss inbound calls.",
		source="llm",
	)

	with patch(
		"routers.missions.generate_mission_assist",
		return_value=mock_response,
	), patch("routers.missions.llm_available", return_value=True):
		res = client.post(
			"/missions/assist",
			json={
				"query": "plumbers in Lyon that miss calls",
				"current_location": "Lyon, France",
			},
		)

	assert res.status_code == 200, res.text
	body = res.json()
	assert body["target_label"] == "Plumbers"
	assert body["location"] == "Lyon, France"
	assert body["source"] == "llm"
	assert len(body["related_targets"]) >= 2


def test_mission_assist_requires_query(client: TestClient) -> None:
	res = client.post("/missions/assist", json={"query": "ab"})
	assert res.status_code == 422
