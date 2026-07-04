"""add mission is_archived column

Revision ID: k5m7n9p1q3r5
Revises: j4k6l8n0p2q4
Create Date: 2026-07-05 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k5m7n9p1q3r5"
down_revision: Union[str, Sequence[str], None] = "j4k6l8n0p2q4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"is_archived",
				sa.Boolean(),
				nullable=False,
				server_default=sa.false(),
			)
		)


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("is_archived")
