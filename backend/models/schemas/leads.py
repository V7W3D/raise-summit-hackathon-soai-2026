from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LeadBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=160)
	description: str = ""
	location: str = ""
	website: str = ""
	email: str = ""
	phone: str = ""
	initials: str = ""
	logo_color: str = "#475569"
	contact_badge: str = ""
	score: int = 0
	score_label: str = ""
	score_tone: str = "orange"
	contactability: int = 0
	confidence: str = "Medium"
	status: str = "High fit"
	category: str = "high_fit"
	industry: str = ""
	employees: str = ""
	service_area: str = ""
	business_type: str = ""
	why: list[str] = Field(default_factory=list)
	missing: list[str] = Field(default_factory=list)
	recommended: list[str] = Field(default_factory=list)
	evidence: list[dict[str, Any]] = Field(default_factory=list)
	sources_scanned: list[dict[str, Any]] = Field(default_factory=list)
	ai_summary: str = ""


class LeadCreate(LeadBase):
	mission_id: int
	slug: str | None = None


class LeadUpdate(BaseModel):
	name: str | None = None
	description: str | None = None
	location: str | None = None
	website: str | None = None
	email: str | None = None
	phone: str | None = None
	contact_badge: str | None = None
	score: int | None = None
	score_label: str | None = None
	score_tone: str | None = None
	contactability: int | None = None
	confidence: str | None = None
	status: str | None = None
	category: str | None = None
	industry: str | None = None
	employees: str | None = None
	service_area: str | None = None
	business_type: str | None = None
	why: list[str] | None = None
	missing: list[str] | None = None
	recommended: list[str] | None = None
	evidence: list[dict[str, Any]] | None = None
	sources_scanned: list[dict[str, Any]] | None = None
	ai_summary: str | None = None


class LeadRead(LeadBase):
	model_config = ConfigDict(from_attributes=True)

	id: int
	slug: str
	mission_id: int
	created_at: datetime
	updated_at: datetime
