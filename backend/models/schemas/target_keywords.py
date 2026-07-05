from __future__ import annotations

from pydantic import BaseModel, Field


class TargetKeywordsResponse(BaseModel):
	keywords: list[str] = Field(default_factory=list)
	source: str = "llm"
