"""drop slug from leads

Revision ID: a7b9c1d3e6f5
Revises: f6a8b0c2e5d4
Create Date: 2026-07-04 20:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b9c1d3e6f5"
down_revision: Union[str, Sequence[str], None] = "f6a8b0c2e5d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.drop_index(batch_op.f("ix_leads_slug"))
		batch_op.drop_column("slug")


def downgrade() -> None:
	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.add_column(sa.Column("slug", sa.String(length=120), nullable=True))
		batch_op.create_index(batch_op.f("ix_leads_slug"), ["slug"], unique=True)

	op.execute("UPDATE leads SET slug = 'lead-' || id")

	with op.batch_alter_table("leads", schema=None) as batch_op:
		batch_op.alter_column("slug", nullable=False)
