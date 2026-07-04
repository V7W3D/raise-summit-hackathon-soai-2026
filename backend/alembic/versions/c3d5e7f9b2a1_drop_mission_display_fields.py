"""drop mission icon, color, and counter columns

Revision ID: c3d5e7f9b2a1
Revises: b2c4e6f8a1d0
Create Date: 2026-07-04 19:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d5e7f9b2a1"
down_revision: Union[str, Sequence[str], None] = "b2c4e6f8a1d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("outreach_sent")
		batch_op.drop_column("qualified")
		batch_op.drop_column("leads_found")
		batch_op.drop_column("color")
		batch_op.drop_column("icon")


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("icon", sa.String(length=40), nullable=False, server_default="building")
		)
		batch_op.add_column(
			sa.Column("color", sa.String(length=20), nullable=False, server_default="blue")
		)
		batch_op.add_column(
			sa.Column("leads_found", sa.Integer(), nullable=False, server_default="0")
		)
		batch_op.add_column(
			sa.Column("qualified", sa.Integer(), nullable=False, server_default="0")
		)
		batch_op.add_column(
			sa.Column("outreach_sent", sa.Integer(), nullable=False, server_default="0")
		)
