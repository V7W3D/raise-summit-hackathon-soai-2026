from __future__ import annotations

from fastapi import APIRouter

from database.dependencies import DbSession
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from models.clients.business_profiles import BusinessProfile

router = APIRouter(prefix="/network-members", tags=["network"])


class NetworkMemberSummary(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	business_name: str
	website: str | None
	network_badge: str | None
	what_we_sell: str


class NetworkStats(BaseModel):
	member_count: int
	members: list[NetworkMemberSummary]


@router.get("", response_model=NetworkStats)
def list_network_members(db: DbSession):
	profiles = db.scalars(
		select(BusinessProfile)
		.where(BusinessProfile.is_network_member.is_(True))
		.order_by(BusinessProfile.business_name)
	).all()
	members = [
		NetworkMemberSummary(
			id=profile.id,
			business_name=profile.business_name,
			website=profile.website,
			network_badge=profile.network_badge,
			what_we_sell=profile.what_we_sell,
		)
		for profile in profiles
	]
	return NetworkStats(member_count=len(members), members=members)
