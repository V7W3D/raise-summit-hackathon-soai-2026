from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing_extensions import Self

from services.mission_intelligence import (
	build_mission_description,
	infer_language_from_location,
	priority_to_urgency,
	suggest_mission_name,
)

MissionUrgency = Literal["low", "medium", "high"]
MissionSearchStatus = Literal["running", "ready", "failed"]
MissionPriority = Literal["fast_wins", "high_value", "broad_coverage"]
OutreachChannel = Literal["email", "phone", "linkedin", "mixed"]


class MissionBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=160)
	target: str = ""
	location: str = ""
	description: str = ""
	target_industry: str | None = Field(default=None, max_length=120)
	target_business_size: str | None = Field(default=None, max_length=120)
	desired_lead_count: int | None = Field(default=None, ge=1)
	urgency: MissionUrgency | None = None
	language: str | None = Field(default=None, max_length=10)
	mission_priority: MissionPriority | None = None
	outreach_channel: OutreachChannel | None = None
	buyer_roles: list[str] = Field(default_factory=list)
	trigger_signals: list[str] = Field(default_factory=list)
	must_have_filters: list[str] = Field(default_factory=list)
	nice_to_have_filters: list[str] = Field(default_factory=list)
	negative_filters: list[str] = Field(default_factory=list)

	@field_validator(
		"buyer_roles",
		"trigger_signals",
		"must_have_filters",
		"nice_to_have_filters",
		"negative_filters",
		mode="before",
	)
	@classmethod
	def _coerce_list(cls, value: object) -> list[str]:
		if value is None:
			return []
		if isinstance(value, list):
			return [str(item).strip() for item in value if str(item).strip()]
		return []


class MissionCreate(MissionBase):
	@model_validator(mode="after")
	def enrich_mission(self) -> Self:
		if self.target.strip() and not self.target_industry:
			self.target_industry = self.target.strip()[:120]

		if not self.language and self.location.strip():
			self.language = infer_language_from_location(self.location)

		if self.mission_priority and not self.urgency:
			self.urgency = priority_to_urgency(self.mission_priority)

		if not self.name.strip():
			self.name = suggest_mission_name(
				target=self.target,
				location=self.location,
				priority=self.mission_priority,
				desired_lead_count=self.desired_lead_count,
			)

		if not self.description.strip():
			self.description = build_mission_description(
				name=self.name,
				target=self.target,
				location=self.location,
				business_size=self.target_business_size,
				priority=self.mission_priority,
				buyer_roles=self.buyer_roles,
				trigger_signals=self.trigger_signals,
				must_have_filters=self.must_have_filters,
				desired_lead_count=self.desired_lead_count,
			)
		return self


class MissionUpdate(BaseModel):
	name: str | None = Field(default=None, max_length=160)
	target: str | None = None
	location: str | None = None
	progress: int | None = None
	description: str | None = Field(default=None, max_length=500)
	target_industry: str | None = Field(default=None, max_length=120)
	target_business_size: str | None = Field(default=None, max_length=120)
	desired_lead_count: int | None = Field(default=None, ge=1)
	urgency: MissionUrgency | None = None
	language: str | None = Field(default=None, max_length=10)
	mission_priority: MissionPriority | None = None
	outreach_channel: OutreachChannel | None = None
	buyer_roles: list[str] | None = None
	trigger_signals: list[str] | None = None
	must_have_filters: list[str] | None = None
	nice_to_have_filters: list[str] | None = None
	negative_filters: list[str] | None = None
	is_archived: bool | None = None


class MissionRead(MissionBase):
	model_config = ConfigDict(from_attributes=True)

	id: int
	search_status: MissionSearchStatus
	search_activated: bool
	progress: int
	is_archived: bool
	created_at: datetime
	updated_at: datetime
	last_activity_at: datetime
