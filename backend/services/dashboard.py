from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from services.lead_display import lead_initials, lead_logo_color
from models.clients.leads import Lead
from models.clients.missions import Mission
from models.clients.user_mission_links import UserMissionLink
from models.clients.users import User
from models.schemas.home import (
	FeedItem,
	HomeDashboard,
	NextBestAction,
	RecentMission,
	RecentProspect,
	Stat,
	UserSummary,
)

# Fit label -> pill tone used by the frontend.
_FIT_TONE = {
	"High fit": "green",
	"Medium fit": "orange",
	"Low fit": "blue",
}


def _fit_from_score(score: int) -> tuple[str, str]:
	if score >= 75:
		return "High fit", "green"
	if score >= 60:
		return "Medium fit", "orange"
	return "Low fit", "blue"


def _rel_time(index: int) -> str:
	# Lightweight relative-time labels for seeded/demo ordering.
	buckets = ["2m ago", "15m ago", "1h ago", "2h ago", "3h ago", "5h ago"]
	return buckets[index] if index < len(buckets) else "1d ago"


def build_dashboard(db: Session, user: User) -> HomeDashboard:
	user_mission_ids = select(UserMissionLink.mission_id).where(
		UserMissionLink.user_id == user.id
	)
	active_missions = (
		db.scalar(
			select(func.count(Mission.id)).where(
				Mission.id.in_(user_mission_ids),
				Mission.is_archived.is_(False),
			)
		)
		or 0
	)
	total_leads = db.scalar(select(func.count(Lead.id))) or 0
	total_qualified = (
		db.scalar(select(func.count(Lead.id)).where(Lead.score >= 75)) or 0
	)

	stats = [
		Stat(icon="missions", label="Missions active", value=str(active_missions)),
		Stat(icon="search", label="New leads found this week", value=str(total_leads)),
		Stat(icon="user", label="Qualified leads", value=str(total_qualified)),
		Stat(icon="send", label="Outreach sent", value="0"),
		Stat(icon="smile", label="Positive replies", value="3"),
		Stat(icon="calendar", label="Meetings booked", value="1"),
	]

	recent_missions_rows = list(
		db.scalars(
			select(Mission)
			.join(UserMissionLink, UserMissionLink.mission_id == Mission.id)
			.where(
				UserMissionLink.user_id == user.id,
				Mission.is_archived.is_(False),
			)
			.order_by(Mission.last_activity_at.desc())
			.limit(3)
		).all()
	)
	recent_missions = [
		RecentMission(
			id=m.id,
			name=m.name,
			updated=f"Updated {_rel_time(i)}",
			progress=m.progress,
		)
		for i, m in enumerate(recent_missions_rows)
	]

	recent_leads_rows = list(
		db.scalars(select(Lead).order_by(Lead.score.desc()).limit(5)).all()
	)
	recent_prospects = []
	for i, lead in enumerate(recent_leads_rows):
		fit, tone = _fit_from_score(lead.score)
		recent_prospects.append(
			RecentProspect(
				id=lead.id,
				initials=lead_initials(lead.name),
				color=lead_logo_color(lead.name),
				name=lead.name,
				meta=lead.location or lead.description,
				fit=fit,
				fit_tone=tone,
				time=_rel_time(i),
			)
		)

	pending_review = max(total_leads - total_qualified, 0)
	next_best_actions = [
		NextBestAction(
			icon="leads",
			priority="High",
			title=f"Review {pending_review} new leads",
			subtitle=(
				f"From your {recent_missions_rows[0].name} mission"
				if recent_missions_rows
				else None
			),
		),
		NextBestAction(icon="draft", priority="High", title="Approve 3 outreach drafts"),
		NextBestAction(
			icon="reply", priority="Medium", title="Reply to 2 interested prospects"
		),
		NextBestAction(
			icon="clock", priority="Medium", title="Follow up with 5 silent leads"
		),
		NextBestAction(
			icon="refresh", priority="Low", title="Update status for 1 ongoing negotiation"
		),
	]

	opportunity_feed = [
		FeedItem(
			dot="#2563eb",
			icon="building",
			text="New matching business detected: Atlantic Fish Pro may fit your sourcing mission",
			time="2m ago",
		),
		FeedItem(
			dot="#16a34a",
			icon="reply",
			text="A lead changed status: BTP Rhône replied positively",
			time="15m ago",
		),
		FeedItem(dot="#ea8a1f", icon="warning", text="Potential duplicate found", time="1h ago"),
		FeedItem(
			dot="#dc2626",
			icon="globe",
			text="Website of a tracked prospect is no longer active",
			time="2h ago",
		),
		FeedItem(
			dot="#2563eb",
			icon="star",
			text="New high-fit company detected in your target niche",
			time="3h ago",
		),
	]

	first_name = user.name.split()[0] if user.name else "there"
	return HomeDashboard(
		user=UserSummary(name=user.name),
		greeting=f"Good morning, {first_name} 👋",
		subtitle="",
		next_best_actions=next_best_actions,
		stats=stats,
		opportunity_feed=opportunity_feed,
		recent_missions=recent_missions,
		recent_prospects=recent_prospects,
	)
