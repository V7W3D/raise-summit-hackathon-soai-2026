import pytest
from pydantic import ValidationError

from search_agent.schemas import SearchAgentInput

from .fixtures import example_input


def test_valid_input_parses():
    agent_input = example_input()
    assert agent_input.mission.goal_type == "find_clients"
    assert agent_input.search_options.max_queries == 6


def test_camel_case_payload_is_accepted():
    payload = {
        "requestId": "req_1",
        "businessProfile": {
            "businessId": "b1",
            "businessName": "CallPilot AI",
            "whatWeSell": "AI phone receptionist",
        },
        "mission": {
            "missionId": "m1",
            "goalType": "find_clients",
            "description": "Find plumbers in Lyon",
        },
    }
    agent_input = SearchAgentInput.model_validate(payload)
    assert agent_input.business_profile.business_name == "CallPilot AI"
    assert agent_input.provider_options.provider == "mock"


def test_missing_required_fields_raise():
    with pytest.raises(ValidationError):
        SearchAgentInput.model_validate({"requestId": "req_1"})


def test_invalid_goal_type_raises():
    payload = example_input().model_dump(by_alias=True)
    payload["mission"]["goalType"] = "find_unicorns"
    with pytest.raises(ValidationError):
        SearchAgentInput.model_validate(payload)


def test_output_serializes_camel_case():
    agent_input = example_input()
    dumped = agent_input.model_dump(by_alias=True)
    assert "businessProfile" in dumped
    assert "whatWeSell" in dumped["businessProfile"]
