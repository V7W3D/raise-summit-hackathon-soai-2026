from __future__ import annotations

from pydantic import BaseModel, Field

from services.mission_intelligence import (
	assess_difficulty,
	build_mission_description,
	build_mission_summary,
	coverage_warning,
	estimate_yield,
	infer_language_from_location,
	suggest_business_sizes,
	suggest_industries_from_profile,
	suggest_mission_name,
)


class MissionPreviewRequest(BaseModel):
	target: str = ""
	location: str = ""
	target_business_size: str | None = None
	desired_lead_count: int | None = Field(default=None, ge=1)
	mission_priority: str | None = None
	buyer_roles: list[str] = Field(default_factory=list)
	trigger_signals: list[str] = Field(default_factory=list)
	must_have_filters: list[str] = Field(default_factory=list)
	nice_to_have_filters: list[str] = Field(default_factory=list)
	negative_filters: list[str] = Field(default_factory=list)
	outreach_channel: str | None = None
	name: str = ""


class MissionPreviewResponse(BaseModel):
	suggested_name: str
	suggested_description: str
	summary: str
	suggested_language: str
	estimated_yield_low: int
	estimated_yield_high: int
	difficulty: str
	coverage_warning: str | None = None


class MissionSuggestionsResponse(BaseModel):
	industries: list[str]
	business_sizes: list[str]
	default_language: str


def build_mission_preview(payload: MissionPreviewRequest) -> MissionPreviewResponse:
	language = infer_language_from_location(payload.location)
	suggested_name = payload.name.strip() or suggest_mission_name(
		target=payload.target,
		location=payload.location,
		priority=payload.mission_priority,
		desired_lead_count=payload.desired_lead_count,
	)
	description = build_mission_description(
		name=suggested_name,
		target=payload.target,
		location=payload.location,
		business_size=payload.target_business_size,
		priority=payload.mission_priority,
		buyer_roles=payload.buyer_roles,
		trigger_signals=payload.trigger_signals,
		must_have_filters=payload.must_have_filters,
		desired_lead_count=payload.desired_lead_count,
	)
	summary = build_mission_summary(
		target=payload.target,
		location=payload.location,
		business_size=payload.target_business_size,
		desired_lead_count=payload.desired_lead_count,
		trigger_signals=payload.trigger_signals,
		must_have_filters=payload.must_have_filters,
		priority=payload.mission_priority,
	)
	yield_low, yield_high = estimate_yield(
		location=payload.location,
		target=payload.target,
		desired_lead_count=payload.desired_lead_count,
		must_have_filters=payload.must_have_filters,
		negative_filters=payload.negative_filters,
	)
	return MissionPreviewResponse(
		suggested_name=suggested_name,
		suggested_description=description,
		summary=summary,
		suggested_language=language,
		estimated_yield_low=yield_low,
		estimated_yield_high=yield_high,
		difficulty=assess_difficulty(
			target=payload.target,
			location=payload.location,
			must_have_filters=payload.must_have_filters,
			negative_filters=payload.negative_filters,
			trigger_signals=payload.trigger_signals,
		),
		coverage_warning=coverage_warning(
			target=payload.target,
			location=payload.location,
			must_have_filters=payload.must_have_filters,
			negative_filters=payload.negative_filters,
		),
	)


def build_mission_suggestions(
	*,
	ideal_customers: list[str] | None = None,
	business_type: str | None = None,
	profile_languages: list[str] | None = None,
	default_location: str = "",
) -> MissionSuggestionsResponse:
	return MissionSuggestionsResponse(
		industries=suggest_industries_from_profile(ideal_customers, business_type),
		business_sizes=suggest_business_sizes(),
		default_language=infer_language_from_location(default_location, profile_languages),
	)
