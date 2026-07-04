from __future__ import annotations

from pydantic import BaseModel


class UserSummary(BaseModel):
	name: str
	plan: str
	initials: str


class NextBestAction(BaseModel):
	icon: str
	priority: str  # High | Medium | Low
	title: str
	subtitle: str | None = None


class Stat(BaseModel):
	icon: str
	label: str
	value: str


class FeedItem(BaseModel):
	dot: str
	icon: str
	text: str
	time: str


class RecentMission(BaseModel):
	id: int
	name: str
	updated: str
	progress: int


class RecentProspect(BaseModel):
	id: int
	slug: str
	initials: str
	color: str
	name: str
	meta: str
	fit: str
	fit_tone: str
	time: str


class HomeDashboard(BaseModel):
	user: UserSummary
	greeting: str
	subtitle: str
	next_best_actions: list[NextBestAction]
	stats: list[Stat]
	opportunity_feed: list[FeedItem]
	recent_missions: list[RecentMission]
	recent_prospects: list[RecentProspect]
