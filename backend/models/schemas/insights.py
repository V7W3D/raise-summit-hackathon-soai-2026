from __future__ import annotations

from pydantic import BaseModel


class PerformanceMetric(BaseModel):
	icon: str
	label: str
	value: str
	delta: str
	delta_tone: str  # green | muted


class FunnelStage(BaseModel):
	label: str
	value: str
	pct: str


class FunnelDrop(BaseModel):
	delta: str
	tone: str  # red | green
	note: str


class WeeklyChange(BaseModel):
	icon: str
	tone: str
	title: str
	text: str


class BestPattern(BaseModel):
	rank: int
	icon: str
	title: str
	text: str
	level: str  # High | Medium


class SourceQuality(BaseModel):
	icon: str
	name: str
	qualified: int
	reply: float
	starred: bool


class Recommendation(BaseModel):
	icon: str
	title: str
	text: str


class InsightsReport(BaseModel):
	mission_id: int | None
	mission_name: str
	date_range: str
	performance: list[PerformanceMetric]
	funnel_stages: list[FunnelStage]
	funnel_drops: list[FunnelDrop]
	weekly_changes: list[WeeklyChange]
	best_patterns: list[BestPattern]
	source_quality: list[SourceQuality]
	recommendations: list[Recommendation]
