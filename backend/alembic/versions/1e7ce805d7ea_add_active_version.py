"""add_active_version

Revision ID: 1e7ce805d7ea
Revises: 20260201_0205
Create Date: 2026-02-15 02:02:07.666053

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '1e7ce805d7ea'
down_revision = '20260201_0205'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('prompts', sa.Column('active_version', sa.Integer(), nullable=True))

    # Backfill: set active_version to the latest existing version per prompt.
    op.execute(
        """
        UPDATE prompts p
        SET active_version = v.max_version
        FROM (
          SELECT prompt_id, MAX(version) AS max_version
          FROM prompt_versions
          GROUP BY prompt_id
        ) v
        WHERE p.id = v.prompt_id AND p.active_version IS NULL
        """
    )

    op.alter_column('prompts', 'active_version', nullable=False, server_default='1')


def downgrade() -> None:
    op.drop_column('prompts', 'active_version')
