from __future__ import annotations

from pydantic import BaseModel, Field


class MissionAssistRequest(BaseModel):
	query: str = Field(..., min_length=3, max_length=500)
	current_location: str = ""


class MissionAssistResponse(BaseModel):
	target: str
	target_label: str
	related_targets: list[str] = Field(default_factory=list)
	location: str = ""
	buyer_roles: list[str] = Field(default_factory=list)
	trigger_signals: list[str] = Field(default_factory=list)
	must_have_filters: list[str] = Field(default_factory=list)
	nice_to_have_filters: list[str] = Field(default_factory=list)
	negative_filters: list[str] = Field(default_factory=list)
	mission_priority: str | None = None
	outreach_channel: str | None = None
	target_business_size: str | None = None
	suggested_lead_count: int = 25
	reasoning: str = ""
	source: str = "llm"
