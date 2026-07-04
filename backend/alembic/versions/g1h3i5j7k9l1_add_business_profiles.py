"""add business_profiles table

Revision ID: g1h3i5j7k9l1
Revises: c9d1e3f5a8b0
Create Date: 2026-07-04 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g1h3i5j7k9l1"
down_revision: Union[str, Sequence[str], None] = "c9d1e3f5a8b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	op.create_table(
		"business_profiles",
		sa.Column("id", sa.Integer(), nullable=False),
		sa.Column("user_id", sa.Integer(), nullable=False),
		sa.Column("business_name", sa.String(length=160), nullable=False),
		sa.Column("business_type", sa.String(length=120), nullable=True),
		sa.Column("description", sa.String(length=500), nullable=True),
		sa.Column("what_we_sell", sa.String(length=500), nullable=False),
		sa.Column("value_proposition", sa.String(length=500), nullable=True),
		sa.Column("target_geographies", sa.JSON(), nullable=False),
		sa.Column("ideal_customers", sa.JSON(), nullable=False),
		sa.Column("bad_fit_customers", sa.JSON(), nullable=False),
		sa.Column("preferred_tone", sa.String(length=120), nullable=True),
		sa.Column("languages", sa.JSON(), nullable=False),
		sa.Column(
			"created_at",
			sa.DateTime(timezone=True),
			server_default=sa.text("(CURRENT_TIMESTAMP)"),
			nullable=False,
		),
		sa.Column(
			"updated_at",
			sa.DateTime(timezone=True),
			server_default=sa.text("(CURRENT_TIMESTAMP)"),
			nullable=False,
		),
		sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
		sa.PrimaryKeyConstraint("id"),
	)
	op.create_index(
		op.f("ix_business_profiles_user_id"), "business_profiles", ["user_id"], unique=True
	)


def downgrade() -> None:
	op.drop_index(op.f("ix_business_profiles_user_id"), table_name="business_profiles")
	op.drop_table("business_profiles")
