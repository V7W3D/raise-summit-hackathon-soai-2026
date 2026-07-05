from __future__ import annotations

from datetime import datetime, timezone

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


def _relative_time(value: datetime | None) -> str:
	if value is None:
		return ""
	if value.tzinfo is None:
		value = value.replace(tzinfo=timezone.utc)
	delta = datetime.now(timezone.utc) - value
	seconds = max(int(delta.total_seconds()), 0)
	if seconds < 60:
		return "just now"
	minutes = seconds // 60
	if minutes < 60:
		return f"{minutes}m ago"
	hours = minutes // 60
	if hours < 24:
		return f"{hours}h ago"
	days = hours // 24
	return f"{days}d ago"


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
	total_approved = (
		db.scalar(select(func.count(Lead.id)).where(Lead.status == "approved")) or 0
	)

	stats = [
		Stat(icon="missions", label="Missions active", value=str(active_missions)),
		Stat(icon="search", label="New leads found this week", value=str(total_leads)),
		Stat(icon="user", label="Qualified leads", value=str(total_qualified)),
		Stat(icon="send", label="Approved leads", value=str(total_approved)),
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
			updated=f"Updated {_relative_time(m.updated_at)}",
			progress=m.progress,
		)
		for m in recent_missions_rows
	]

	recent_leads_rows = list(
		db.scalars(select(Lead).order_by(Lead.score.desc()).limit(5)).all()
	)
	recent_prospects = []
	for lead in recent_leads_rows:
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
				time=_relative_time(lead.created_at),
			)
		)

	pending_review = max(total_leads - total_approved, 0)
	next_best_actions = []
	if pending_review > 0:
		next_best_actions.append(
			NextBestAction(
				icon="leads",
				priority="High",
				title=f"Review {pending_review} new leads",
				subtitle=(
					f"From your {recent_missions_rows[0].name} mission"
					if recent_missions_rows
					else None
				),
			)
		)
	if total_qualified > 0:
		next_best_actions.append(
			NextBestAction(
				icon="draft",
				priority="High",
				title=f"Draft outreach for {total_qualified} high-fit leads",
			)
		)

	opportunity_feed = [
		FeedItem(
			dot="#2563eb",
			icon="building",
			text=f"New matching business detected: {lead.name}",
			time=_relative_time(lead.created_at),
		)
		for lead in recent_leads_rows[:5]
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
