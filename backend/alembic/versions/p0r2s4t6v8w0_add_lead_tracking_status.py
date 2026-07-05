"""add tracking status to leads

Revision ID: p0r2s4t6v8w0
Revises: o9q1r3s5t7u9
Create Date: 2026-07-05 07:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "p0r2s4t6v8w0"
down_revision: Union[str, Sequence[str], None] = "o9q1r3s5t7u9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"tracking_status",
				sa.String(length=20),
				nullable=False,
				server_default="to_contact",
			)
		)


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_column("tracking_status")
