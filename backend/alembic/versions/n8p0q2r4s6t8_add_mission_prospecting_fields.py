"""add prospecting intelligence fields to missions

Revision ID: n8p0q2r4s6t8
Revises: m7o9p1q3r5s7
Create Date: 2026-07-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "n8p0q2r4s6t8"
down_revision: Union[str, Sequence[str], None] = "m7o9p1q3r5s7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("mission_priority", sa.String(length=20), nullable=True)
		)
		batch_op.add_column(
			sa.Column("outreach_channel", sa.String(length=20), nullable=True)
		)
		batch_op.add_column(
			sa.Column("buyer_roles", sa.JSON(), nullable=False, server_default="[]")
		)
		batch_op.add_column(
			sa.Column("trigger_signals", sa.JSON(), nullable=False, server_default="[]")
		)
		batch_op.add_column(
			sa.Column("must_have_filters", sa.JSON(), nullable=False, server_default="[]")
		)
		batch_op.add_column(
			sa.Column("nice_to_have_filters", sa.JSON(), nullable=False, server_default="[]")
		)
		batch_op.add_column(
			sa.Column("negative_filters", sa.JSON(), nullable=False, server_default="[]")
		)


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("negative_filters")
		batch_op.drop_column("nice_to_have_filters")
		batch_op.drop_column("must_have_filters")
		batch_op.drop_column("trigger_signals")
		batch_op.drop_column("buyer_roles")
		batch_op.drop_column("outreach_channel")
		batch_op.drop_column("mission_priority")
