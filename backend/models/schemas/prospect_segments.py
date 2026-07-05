from __future__ import annotations

from pydantic import BaseModel, Field


class ProspectSegment(BaseModel):
	id: str
	label: str
	target: str
	reason: str
	trigger_signals: list[str] = Field(default_factory=list)
	buyer_roles: list[str] = Field(default_factory=list)


class ProspectSegmentsResponse(BaseModel):
	segments: list[ProspectSegment] = Field(default_factory=list)
	source: str = "llm"
