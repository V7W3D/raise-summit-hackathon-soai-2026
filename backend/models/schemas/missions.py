from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing_extensions import Self

MissionUrgency = Literal["low", "medium", "high"]


def _default_description(name: str, target: str) -> str:
	name = name.strip()
	target = target.strip()
	if target and target.lower() not in name.lower():
		return f"{name}: {target}"
	return target or name


class MissionBase(BaseModel):
	name: str = Field(..., min_length=1, max_length=160)
	target: str = ""
	location: str = ""
	status: str = "Draft"
	description: str = ""
	target_industry: str | None = Field(default=None, max_length=120)
	target_business_size: str | None = Field(default=None, max_length=120)
	desired_lead_count: int | None = Field(default=None, ge=1)
	urgency: MissionUrgency | None = None
	language: str | None = Field(default=None, max_length=10)


class MissionCreate(MissionBase):
	@model_validator(mode="after")
	def fill_description_if_missing(self) -> Self:
		if not self.description.strip():
			self.description = _default_description(self.name, self.target)
		return self


class MissionUpdate(BaseModel):
	name: str | None = Field(default=None, max_length=160)
	target: str | None = None
	location: str | None = None
	status: str | None = None
	progress: int | None = None
	description: str | None = Field(default=None, max_length=500)
	target_industry: str | None = Field(default=None, max_length=120)
	target_business_size: str | None = Field(default=None, max_length=120)
	desired_lead_count: int | None = Field(default=None, ge=1)
	urgency: MissionUrgency | None = None
	language: str | None = Field(default=None, max_length=10)


class MissionRead(MissionBase):
	model_config = ConfigDict(from_attributes=True)

	id: int
	progress: int
	created_at: datetime
	updated_at: datetime
	last_activity_at: datetime
