"""add prompt tags

Revision ID: 20260223_0200
Revises: 20260221_0200
Create Date: 2026-02-23 02:00:00

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260223_0200"
down_revision = "20260221_0200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_tags_name", "tags", ["name"], unique=True)

    op.create_table(
        "prompt_tags",
        sa.Column("prompt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tag_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["prompt_id"], ["prompts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("prompt_id", "tag_id"),
    )
    op.create_index("ix_prompt_tags_prompt_id", "prompt_tags", ["prompt_id"], unique=False)
    op.create_index("ix_prompt_tags_tag_id", "prompt_tags", ["tag_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_prompt_tags_tag_id", table_name="prompt_tags")
    op.drop_index("ix_prompt_tags_prompt_id", table_name="prompt_tags")
    op.drop_table("prompt_tags")

    op.drop_index("ix_tags_name", table_name="tags")
    op.drop_table("tags")
