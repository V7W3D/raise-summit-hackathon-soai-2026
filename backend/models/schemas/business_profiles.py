from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BusinessProfileBase(BaseModel):
	business_name: str = Field(..., min_length=1, max_length=160)
	business_type: str | None = Field(default=None, max_length=120)
	description: str | None = Field(default=None, max_length=500)
	what_we_sell: str = Field(..., min_length=1, max_length=500)
	value_proposition: str | None = Field(default=None, max_length=500)
	target_geographies: list[str] = Field(default_factory=list)
	ideal_customers: list[str] = Field(default_factory=list)
	bad_fit_customers: list[str] = Field(default_factory=list)
	preferred_tone: str | None = Field(default=None, max_length=120)
	languages: list[str] = Field(default_factory=list)


class BusinessProfileCreate(BusinessProfileBase):
	pass


class BusinessProfileUpdate(BaseModel):
	business_name: str | None = Field(default=None, max_length=160)
	business_type: str | None = Field(default=None, max_length=120)
	description: str | None = Field(default=None, max_length=500)
	what_we_sell: str | None = Field(default=None, max_length=500)
	value_proposition: str | None = Field(default=None, max_length=500)
	target_geographies: list[str] | None = None
	ideal_customers: list[str] | None = None
	bad_fit_customers: list[str] | None = None
	preferred_tone: str | None = Field(default=None, max_length=120)
	languages: list[str] | None = None


class BusinessProfileRead(BusinessProfileBase):
	model_config = ConfigDict(from_attributes=True)

	id: int
	user_id: int
	created_at: datetime
	updated_at: datetime
