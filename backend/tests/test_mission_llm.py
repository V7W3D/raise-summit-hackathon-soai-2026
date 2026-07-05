from __future__ import annotations

from unittest.mock import patch

import pytest

from services.mission_llm import MissionLLMError, generate_mission_assist


SAMPLE_JSON = """{
  "target": "plumber",
  "target_label": "Plumbers",
  "related_targets": ["Electricians", "Locksmiths"],
  "location": "Lyon, France",
  "buyer_roles": ["Owner"],
  "trigger_signals": ["Missed calls"],
  "must_have_filters": ["Visible phone number"],
  "nice_to_have_filters": ["Active website"],
  "negative_filters": ["Franchises"],
  "mission_priority": "fast_wins",
  "outreach_channel": "phone",
  "target_business_size": "small",
  "suggested_lead_count": 25,
  "reasoning": "Small plumbers in Lyon likely miss inbound calls."
}"""


def test_generate_mission_assist_parses_llm_json() -> None:
	with patch("services.mission_llm._generate_with_llm", return_value=SAMPLE_JSON):
		result = generate_mission_assist(
			query="plumbers in Lyon that miss calls",
			business_profile={"whatWeSell": "AI receptionist"},
			current_location="Lyon, France",
		)

	assert result.target_label == "Plumbers"
	assert result.location == "Lyon, France"
	assert result.mission_priority == "fast_wins"
	assert result.source == "llm"


def test_generate_mission_assist_rejects_short_query() -> None:
	with pytest.raises(MissionLLMError):
		generate_mission_assist(query="ab")
