"""drop ai_summary from leads

Revision ID: c9d1e3f5a8b0
Revises: b8c0d2e4f6a7
Create Date: 2026-07-04 20:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9d1e3f5a8b0"
down_revision: Union[str, Sequence[str], None] = "b8c0d2e4f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_column("ai_summary")


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column("ai_summary", sa.String(length=600), nullable=False, server_default="")
		)
