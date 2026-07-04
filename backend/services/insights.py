from __future__ import annotations

from sqlalchemy.orm import Session

from models.clients.missions import Mission
from models.schemas.insights import (
	BestPattern,
	FunnelDrop,
	FunnelStage,
	InsightsReport,
	PerformanceMetric,
	Recommendation,
	SourceQuality,
	WeeklyChange,
)

_DATE_RANGE = "May 23 – May 30, 2025"


def _performance() -> list[PerformanceMetric]:
	return [
		PerformanceMetric(icon="user", label="Leads found", value="1,247", delta="+18% vs May 16–22", delta_tone="green"),
		PerformanceMetric(icon="check", label="Qualified leads", value="612", delta="49% of leads", delta_tone="muted"),
		PerformanceMetric(icon="send", label="Messages sent", value="486", delta="+22% vs May 16–22", delta_tone="green"),
		PerformanceMetric(icon="reply", label="Reply rate", value="18.7%", delta="+3.1pp vs May 16–22", delta_tone="green"),
		PerformanceMetric(icon="star", label="Positive reply rate", value="6.2%", delta="+1.4pp vs May 16–22", delta_tone="green"),
		PerformanceMetric(icon="calendar", label="Meetings booked", value="26", delta="+2 vs May 16–22", delta_tone="green"),
		PerformanceMetric(icon="target", label="Conversion rate", value="4.2%", delta="+0.6pp vs May 16–22", delta_tone="green"),
	]


def _funnel_stages() -> list[FunnelStage]:
	return [
		FunnelStage(label="Results found", value="1,247", pct="100%"),
		FunnelStage(label="Qualified", value="612", pct="49%"),
		FunnelStage(label="Contactable", value="486", pct="38.9%"),
		FunnelStage(label="Outreach sent", value="486", pct="38.9%"),
		FunnelStage(label="Replied", value="91", pct="18.7%"),
		FunnelStage(label="Meeting booked", value="26", pct="4.2%"),
	]


def _funnel_drops() -> list[FunnelDrop]:
	return [
		FunnelDrop(delta="-51%", tone="red", note="Too many irrelevant search results."),
		FunnelDrop(delta="-22%", tone="red", note="Missing contact info or email."),
		FunnelDrop(delta="0%", tone="green", note="Good reach rate. Keep it up."),
		FunnelDrop(delta="-81%", tone="red", note="Weak reply rate. Improve messaging."),
		FunnelDrop(delta="-71%", tone="red", note="Good replies but no conversion."),
	]


def _weekly_changes() -> list[WeeklyChange]:
	return [
		WeeklyChange(icon="trend", tone="green", title="Reply rate improved", text="Reply rate increased by 3.1pp, likely due to shorter emails and better fit."),
		WeeklyChange(icon="building", tone="blue", title="More local businesses", text="You contacted more local companies, which tend to respond better."),
		WeeklyChange(icon="calendar", tone="orange", title="Meetings up", text="2 more meetings booked compared to last week."),
	]


def _best_patterns() -> list[BestPattern]:
	return [
		BestPattern(rank=1, icon="user", title="Companies with active websites reply more", text="Reply rate is 23% higher when a website is active.", level="High"),
		BestPattern(rank=2, icon="pin", title="Local businesses respond better than remote ones", text="Local companies have a 34% higher positive reply rate.", level="High"),
		BestPattern(rank=3, icon="mail", title="Short, direct emails outperform long ones", text="Emails under 90 words get 28% more replies.", level="Medium"),
		BestPattern(rank=4, icon="phone", title="Phone-first businesses are a stronger fit", text="Phone-first companies are 1.6x more likely to reply.", level="Medium"),
	]


def _source_quality() -> list[SourceQuality]:
	return [
		SourceQuality(icon="google", name="Google", qualified=52, reply=19.6, starred=False),
		SourceQuality(icon="directory", name="Directory", qualified=46, reply=16.1, starred=False),
		SourceQuality(icon="referral", name="Referral", qualified=61, reply=24.3, starred=True),
		SourceQuality(icon="feed", name="New-subscriber feed", qualified=37, reply=11.2, starred=False),
	]


def _recommendations() -> list[Recommendation]:
	return [
		Recommendation(icon="target", title="Narrow your mission", text="Focus on concrete & general construction in Lyon."),
		Recommendation(icon="users", title="Target smaller companies", text="Businesses with 2–20 employees reply more."),
		Recommendation(icon="phone", title="Focus on businesses with visible phone flow", text="They are 1.6x more likely to respond."),
		Recommendation(icon="mail", title="Try shorter outreach", text="Keep emails under 90 words for better results."),
	]


def build_insights(db: Session, mission_id: int | None) -> InsightsReport:
	mission_name = "Construction Clients – Lyon"
	if mission_id is not None:
		mission = db.get(Mission, mission_id)
		if mission is not None:
			mission_name = mission.name

	return InsightsReport(
		mission_id=mission_id,
		mission_name=mission_name,
		date_range=_DATE_RANGE,
		performance=_performance(),
		funnel_stages=_funnel_stages(),
		funnel_drops=_funnel_drops(),
		weekly_changes=_weekly_changes(),
		best_patterns=_best_patterns(),
		source_quality=_source_quality(),
		recommendations=_recommendations(),
	)
