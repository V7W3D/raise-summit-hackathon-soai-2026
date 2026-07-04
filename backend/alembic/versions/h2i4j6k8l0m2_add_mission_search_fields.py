"""add search-agent mission fields to missions

Revision ID: h2i4j6k8l0m2
Revises: g1h3i5j7k9l1
Create Date: 2026-07-04 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h2i4j6k8l0m2"
down_revision: Union[str, Sequence[str], None] = "g1h3i5j7k9l1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.add_column(
			sa.Column(
				"goal_type",
				sa.String(length=30),
				nullable=False,
				server_default="find_clients",
			)
		)
		batch_op.add_column(
			sa.Column("description", sa.String(length=500), nullable=False, server_default="")
		)
		batch_op.add_column(sa.Column("target_industry", sa.String(length=120), nullable=True))
		batch_op.add_column(sa.Column("target_business_size", sa.String(length=120), nullable=True))
		batch_op.add_column(sa.Column("desired_lead_count", sa.Integer(), nullable=True))
		batch_op.add_column(sa.Column("urgency", sa.String(length=10), nullable=True))
		batch_op.add_column(sa.Column("language", sa.String(length=10), nullable=True))

	op.execute(
		"""
		UPDATE missions
		SET description = CASE
			WHEN target != '' AND INSTR(LOWER(name), LOWER(target)) = 0 THEN name || ': ' || target
			ELSE COALESCE(NULLIF(target, ''), name)
		END
		WHERE description = ''
		"""
	)

	op.execute(
		"""
		UPDATE missions
		SET goal_type = CASE
			WHEN LOWER(name || ' ' || target) LIKE '%supplier%' THEN 'find_suppliers'
			WHEN LOWER(name || ' ' || target) LIKE '%consultant%' THEN 'find_consultants'
			WHEN LOWER(name || ' ' || target) LIKE '%partner%' THEN 'find_partners'
			WHEN LOWER(name || ' ' || target) LIKE '%investor%' THEN 'find_investors'
			WHEN LOWER(name || ' ' || target) LIKE '%hire%' OR LOWER(name || ' ' || target) LIKE '%recruit%' THEN 'find_hires'
			ELSE 'find_clients'
		END
		"""
	)

	op.execute(
		"""
		UPDATE missions
		SET target_industry = CASE
			WHEN LOWER(name || ' ' || target) LIKE '%construction%' THEN 'construction'
			WHEN LOWER(name || ' ' || target) LIKE '%seafood%' THEN 'seafood'
			WHEN LOWER(name || ' ' || target) LIKE '%accounting%' THEN 'accounting'
			WHEN LOWER(name || ' ' || target) LIKE '%e-commerce%' OR LOWER(name || ' ' || target) LIKE '%ecommerce%' THEN 'e-commerce'
			WHEN LOWER(name || ' ' || target) LIKE '%food tech%' OR LOWER(name || ' ' || target) LIKE '%foodtech%' THEN 'food tech'
			ELSE NULL
		END
		"""
	)

	op.execute(
		"""
		UPDATE missions
		SET language = 'fr'
		WHERE LOWER(name || ' ' || target || ' ' || location) LIKE '%france%'
		   OR LOWER(name || ' ' || target || ' ' || location) LIKE '%lyon%'
		   OR LOWER(name || ' ' || target || ' ' || location) LIKE '%paris%'
		   OR LOWER(name || ' ' || target || ' ' || location) LIKE '%french%'
		   OR LOWER(name || ' ' || target || ' ' || location) LIKE '%français%'
		"""
	)


def downgrade() -> None:
	with op.batch_alter_table("missions", schema=None) as batch_op:
		batch_op.drop_column("language")
		batch_op.drop_column("urgency")
		batch_op.drop_column("desired_lead_count")
		batch_op.drop_column("target_business_size")
		batch_op.drop_column("target_industry")
		batch_op.drop_column("description")
		batch_op.drop_column("goal_type")
