from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MissionBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=160)
	target: str = ""
	mission_type: str = "Clients"
	location: str = ""
	status: str = "Draft"
	icon: str = "building"
	color: str = "blue"


class MissionCreate(MissionBase):
	pass


class MissionUpdate(BaseModel):
	name: str | None = Field(default=None, max_length=160)
	target: str | None = None
	mission_type: str | None = None
	location: str | None = None
	status: str | None = None
	icon: str | None = None
	color: str | None = None
	leads_found: int | None = None
	qualified: int | None = None
	outreach_sent: int | None = None
	progress: int | None = None


class MissionRead(MissionBase):
	model_config = ConfigDict(from_attributes=True)

	id: int
	leads_found: int
	qualified: int
	outreach_sent: int
	progress: int
	created_at: datetime
	updated_at: datetime
	last_activity_at: datetime
