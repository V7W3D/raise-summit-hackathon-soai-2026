"""add network member fields to business profiles

Revision ID: q2r4t6v8w0x2
Revises: p0r2s4t6v8w0
Create Date: 2026-07-05 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "q2r4t6v8w0x2"
down_revision: Union[str, Sequence[str], None] = "p0r2s4t6v8w0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("business_profiles", schema=None) as batch_op:
		batch_op.add_column(sa.Column("website", sa.String(length=255), nullable=True))
		batch_op.add_column(
			sa.Column(
				"is_network_member",
				sa.Boolean(),
				nullable=False,
				server_default=sa.false(),
			)
		)
		batch_op.add_column(sa.Column("network_badge", sa.String(length=20), nullable=True))


def downgrade() -> None:
	with op.batch_alter_table("business_profiles", schema=None) as batch_op:
		batch_op.drop_column("network_badge")
		batch_op.drop_column("is_network_member")
		batch_op.drop_column("website")
