from __future__ import annotations

from unittest.mock import patch

from services.mission_llm import generate_target_keywords


def test_generate_target_keywords_parses_llm_response() -> None:
	raw = '{"keywords": ["Plumber", "Electrician", "Garage", "Clinic", "Locksmith", "Restaurant"]}'
	with patch("services.mission_llm._generate_with_llm", return_value=raw):
		keywords, source = generate_target_keywords(
			business_profile={"whatWeSell": "AI phone receptionist", "idealCustomers": ["plumbers"]},
		)

	assert source == "llm"
	assert keywords == ["Plumber", "Electrician", "Garage", "Clinic", "Locksmith", "Restaurant"]


def test_generate_target_keywords_falls_back_without_llm() -> None:
	with patch("services.mission_llm._generate_with_llm", side_effect=Exception("quota")):
		keywords, source = generate_target_keywords(
			business_profile={"idealCustomers": ["small local service companies"]},
		)

	assert source == "fallback"
	assert len(keywords) >= 5
