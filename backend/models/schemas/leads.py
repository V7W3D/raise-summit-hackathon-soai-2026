from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

LeadStatus = Literal["new", "approved", "rejected"]
TrackingStatus = Literal["to_contact", "contacted", "replied", "engaged", "won", "lost"]


class LeadBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=160)
	description: str = ""
	location: str = ""
	website: str = ""
	email: str = ""
	phone: str = ""
	score: int = 0
	status: LeadStatus = "new"
	tracking_status: TrackingStatus = "to_contact"
	why: list[str] = Field(default_factory=list)
	missing: list[str] = Field(default_factory=list)
	recommended: list[str] = Field(default_factory=list)
	evidence: list[dict[str, Any]] = Field(default_factory=list)
	sources_scanned: list[dict[str, Any]] = Field(default_factory=list)


class LeadCreate(LeadBase):
	mission_id: int


class LeadUpdate(BaseModel):
	name: str | None = None
	description: str | None = None
	location: str | None = None
	website: str | None = None
	email: str | None = None
	phone: str | None = None
	score: int | None = None
	status: LeadStatus | None = None
	tracking_status: TrackingStatus | None = None
	why: list[str] | None = None
	missing: list[str] | None = None
	recommended: list[str] | None = None
	evidence: list[dict[str, Any]] | None = None
	sources_scanned: list[dict[str, Any]] | None = None


class LeadRead(LeadBase):
	model_config = ConfigDict(from_attributes=True)

	id: int
	mission_id: int
	created_at: datetime
	updated_at: datetime
