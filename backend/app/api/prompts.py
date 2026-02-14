from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Prompt, PromptVersion
from app.schemas.prompt import (
    PromptCreateIn,
    PromptDetailOut,
    PromptOut,
    PromptUpdateIn,
    PromptVersionCreateIn,
    PromptVersionOut,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.post("", response_model=PromptDetailOut, status_code=status.HTTP_201_CREATED)
def create_prompt(payload: PromptCreateIn, db: Session = Depends(get_db)):
    existing = db.scalar(select(Prompt).where(Prompt.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=409, detail="prompt name already exists")

    prompt = Prompt(name=payload.name, description=payload.description)
    db.add(prompt)
    db.flush()  # assign prompt.id

    version = PromptVersion(
        prompt_id=prompt.id,
        version=1,
        content=payload.content,
        parameters=payload.parameters,
    )
    db.add(version)
    db.commit()

    # Avoid any lazy-loading surprises during response serialization.
    return get_prompt(prompt.id, db)


@router.get("", response_model=list[PromptOut])
def list_prompts(
    q: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List prompts with their latest version.

    - Supports basic search via `q` (matches prompt name/description).
    - Supports pagination via `limit` and `offset`.

    Avoids N+1 queries by joining against a (prompt_id, max(version)) subquery.
    """

    latest_versions = (
        select(
            PromptVersion.prompt_id.label("prompt_id"),
            func.max(PromptVersion.version).label("max_version"),
        )
        .group_by(PromptVersion.prompt_id)
        .subquery()
    )

    stmt = (
        select(Prompt, PromptVersion)
        .outerjoin(latest_versions, latest_versions.c.prompt_id == Prompt.id)
        .outerjoin(
            PromptVersion,
            (PromptVersion.prompt_id == Prompt.id)
            & (PromptVersion.version == latest_versions.c.max_version),
        )
        .order_by(Prompt.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if q is not None and q.strip() != "":
        like = f"%{q.strip()}%"
        stmt = stmt.where((Prompt.name.ilike(like)) | (Prompt.description.ilike(like)))

    rows = db.execute(stmt).all()

    out: list[PromptOut] = []
    for prompt, latest in rows:
        out.append(
            PromptOut(
                id=prompt.id,
                name=prompt.name,
                description=prompt.description,
                created_at=prompt.created_at,
                latest_version=PromptVersionOut.model_validate(latest)
                if latest is not None
                else None,
            )
        )

    return out


@router.get("/{prompt_id}", response_model=PromptDetailOut)
def get_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    versions = db.scalars(
        select(PromptVersion)
        .where(PromptVersion.prompt_id == prompt_id)
        .order_by(PromptVersion.version.desc())
    ).all()

    return PromptDetailOut(
        id=prompt.id,
        name=prompt.name,
        description=prompt.description,
        created_at=prompt.created_at,
        versions=[PromptVersionOut.model_validate(v) for v in versions],
    )


@router.patch("/{prompt_id}", response_model=PromptDetailOut)
def update_prompt(prompt_id: uuid.UUID, payload: PromptUpdateIn, db: Session = Depends(get_db)):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    prompt.description = payload.description
    db.add(prompt)
    db.commit()

    return get_prompt(prompt_id, db)


@router.post("/{prompt_id}/versions", response_model=PromptVersionOut, status_code=status.HTTP_201_CREATED)
def create_prompt_version(
    prompt_id: uuid.UUID, payload: PromptVersionCreateIn, db: Session = Depends(get_db)
):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    # Version numbers are sequential per-prompt. We enforce uniqueness at the DB level
    # (prompt_id, version). In the rare case of concurrent writes, we retry.
    for _attempt in range(3):
        next_version = (
            db.scalar(
                select(func.coalesce(func.max(PromptVersion.version), 0)).where(
                    PromptVersion.prompt_id == prompt_id
                )
            )
            or 0
        ) + 1

        version = PromptVersion(
            prompt_id=prompt_id,
            version=next_version,
            content=payload.content,
            parameters=payload.parameters,
        )

        try:
            db.add(version)
            db.commit()
        except IntegrityError:
            db.rollback()
            continue

        db.refresh(version)
        return version

    raise HTTPException(status_code=409, detail="could not allocate next prompt version (retry)")


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        return

    db.delete(prompt)
    db.commit()
