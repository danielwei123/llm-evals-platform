from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Tag, prompt_tags
from app.schemas.tag import TagOut

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(
    q: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List tags with how many prompts currently use each tag.

    This is primarily a UI helper endpoint so users can discover existing tags.
    """

    stmt = (
        select(
            Tag.name,
            Tag.created_at,
            func.count(prompt_tags.c.prompt_id).label("prompt_count"),
        )
        .select_from(Tag)
        .outerjoin(prompt_tags, prompt_tags.c.tag_id == Tag.id)
        .group_by(Tag.id)
        .order_by(func.count(prompt_tags.c.prompt_id).desc(), Tag.name.asc())
        .limit(limit)
        .offset(offset)
    )

    if q is not None and q.strip() != "":
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(Tag.name.ilike(like))

    rows = db.execute(stmt).all()

    return [
        TagOut(name=name, created_at=created_at, prompt_count=int(prompt_count))
        for (name, created_at, prompt_count) in rows
    ]
