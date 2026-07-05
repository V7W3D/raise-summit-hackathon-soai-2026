from services.mission_intelligence import (
	build_mission_description,
	build_mission_summary,
	infer_language_from_location,
	suggest_mission_name,
)


def test_infer_language_from_french_location() -> None:
	assert infer_language_from_location("Lyon, France") == "fr"
	assert infer_language_from_location("London, UK") == "en"


def test_suggest_mission_name() -> None:
	name = suggest_mission_name(
		target="plumber",
		location="Lyon, France",
		priority="fast_wins",
		desired_lead_count=25,
	)
	assert "Plumber" in name
	assert "Lyon" in name
	assert "25 leads" in name


def test_build_mission_summary_includes_filters() -> None:
	summary = build_mission_summary(
		target="plumber",
		location="Lyon, France",
		business_size="small",
		desired_lead_count=25,
		trigger_signals=["Missed calls"],
		must_have_filters=["Visible phone number"],
		priority="fast_wins",
	)
	assert "25" in summary
	assert "plumber" in summary
	assert "Lyon" in summary


def test_build_mission_description_is_rich() -> None:
	description = build_mission_description(
		name="Plumber – Lyon",
		target="plumber",
		location="Lyon, France",
		business_size="small",
		priority="fast_wins",
		buyer_roles=["Owner"],
		trigger_signals=["Missed calls"],
		must_have_filters=["Visible phone number"],
		desired_lead_count=25,
	)
	assert "plumber" in description.lower()
	assert "owner" in description.lower()
