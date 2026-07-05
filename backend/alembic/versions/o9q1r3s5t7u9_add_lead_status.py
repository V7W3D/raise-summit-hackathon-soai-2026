"""add workflow status to leads

Revision ID: o9q1r3s5t7u9
Revises: n8p0q2r4s6t8
Create Date: 2026-07-05 05:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "o9q1r3s5t7u9"
down_revision: Union[str, Sequence[str], None] = "n8p0q2r4s6t8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"status",
				sa.String(length=20),
				nullable=False,
				server_default="new",
			)
		)


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_column("status")
