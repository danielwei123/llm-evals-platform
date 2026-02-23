from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Prompt, PromptVersion, Tag, prompt_tags
from app.schemas.prompt import (
    PromptActivateIn,
    PromptCreateIn,
    PromptDetailOut,
    PromptOut,
    PromptResolvedOut,
    PromptUpdateIn,
    PromptVersionCreateIn,
    PromptVersionOut,
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


def _normalize_tag_names(raw: list[str] | None) -> list[str]:
    if raw is None:
        return []

    out: list[str] = []
    seen: set[str] = set()
    for t in raw:
        if t is None:
            continue
        name = t.strip().lower()
        if name == "":
            continue
        if len(name) > 64:
            raise HTTPException(status_code=422, detail=f"tag too long: {name[:64]}...")
        if name in seen:
            continue
        seen.add(name)
        out.append(name)

    if len(out) > 20:
        raise HTTPException(status_code=422, detail="too many tags (max 20)")

    return out


def _set_prompt_tags(prompt: Prompt, tag_names: list[str], db: Session) -> None:
    """Replace prompt.tags with canonical tag set."""

    if len(tag_names) == 0:
        prompt.tags = []
        return

    existing = db.scalars(select(Tag).where(Tag.name.in_(tag_names))).all()
    by_name = {t.name: t for t in existing}

    for name in tag_names:
        if name not in by_name:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
            by_name[name] = tag

    prompt.tags = [by_name[name] for name in tag_names]


def _fetch_tags_by_prompt_id(prompt_ids: list[uuid.UUID], db: Session) -> dict[uuid.UUID, list[str]]:
    if len(prompt_ids) == 0:
        return {}

    rows = db.execute(
        select(prompt_tags.c.prompt_id, Tag.name)
        .join(Tag, Tag.id == prompt_tags.c.tag_id)
        .where(prompt_tags.c.prompt_id.in_(prompt_ids))
        .order_by(Tag.name.asc())
    ).all()

    out: dict[uuid.UUID, list[str]] = {pid: [] for pid in prompt_ids}
    for pid, name in rows:
        out.setdefault(pid, []).append(name)
    return out


@router.post("", response_model=PromptDetailOut, status_code=status.HTTP_201_CREATED)
def create_prompt(payload: PromptCreateIn, db: Session = Depends(get_db)):
    existing = db.scalar(select(Prompt).where(Prompt.name == payload.name))
    if existing is not None:
        raise HTTPException(status_code=409, detail="prompt name already exists")

    prompt = Prompt(name=payload.name, description=payload.description, active_version=1)
    db.add(prompt)
    db.flush()  # assign prompt.id

    _set_prompt_tags(prompt, _normalize_tag_names(payload.tags), db)

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
    tag: str | None = None,
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

    if tag is not None and tag.strip() != "":
        tag_name = tag.strip().lower()
        stmt = (
            stmt.join(prompt_tags, prompt_tags.c.prompt_id == Prompt.id)
            .join(Tag, Tag.id == prompt_tags.c.tag_id)
            .where(Tag.name == tag_name)
        )

    rows = db.execute(stmt).all()

    prompt_ids = [p.id for p, _latest in rows]
    tags_by_prompt_id = _fetch_tags_by_prompt_id(prompt_ids, db)

    out: list[PromptOut] = []
    for prompt, latest in rows:
        out.append(
            PromptOut(
                id=prompt.id,
                name=prompt.name,
                description=prompt.description,
                tags=tags_by_prompt_id.get(prompt.id, []),
                created_at=prompt.created_at,
                active_version=prompt.active_version,
                latest_version=PromptVersionOut.model_validate(latest)
                if latest is not None
                else None,
            )
        )

    return out


@router.get("/by-name/{name}", response_model=PromptResolvedOut)
def resolve_prompt_by_name(name: str, db: Session = Depends(get_db)):
    """Resolve a prompt by stable name to its active version.

    This is the read path runners will use: stable prompt name → immutable prompt
    version (content + parameters).
    """

    prompt = db.scalar(select(Prompt).where(Prompt.name == name))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    active = db.scalar(
        select(PromptVersion).where(
            (PromptVersion.prompt_id == prompt.id)
            & (PromptVersion.version == prompt.active_version)
        )
    )
    if active is None:
        # Should never happen, but we keep the API honest.
        raise HTTPException(status_code=409, detail="active prompt version missing")

    return PromptResolvedOut(
        id=prompt.id,
        name=prompt.name,
        description=prompt.description,
        tags=[t.name for t in prompt.tags],
        created_at=prompt.created_at,
        active_version=prompt.active_version,
        active=PromptVersionOut.model_validate(active),
    )


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
        tags=[t.name for t in prompt.tags],
        created_at=prompt.created_at,
        active_version=prompt.active_version,
        versions=[PromptVersionOut.model_validate(v) for v in versions],
    )


@router.patch("/{prompt_id}", response_model=PromptDetailOut)
def update_prompt(prompt_id: uuid.UUID, payload: PromptUpdateIn, db: Session = Depends(get_db)):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    prompt.description = payload.description

    if payload.tags is not None:
        _set_prompt_tags(prompt, _normalize_tag_names(payload.tags), db)

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


@router.post("/{prompt_id}/activate", response_model=PromptDetailOut)
def activate_prompt_version(
    prompt_id: uuid.UUID, payload: PromptActivateIn, db: Session = Depends(get_db)
):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    exists = db.scalar(
        select(PromptVersion.id).where(
            (PromptVersion.prompt_id == prompt_id) & (PromptVersion.version == payload.version)
        )
    )
    if exists is None:
        raise HTTPException(status_code=404, detail="prompt version not found")

    prompt.active_version = payload.version
    db.add(prompt)
    db.commit()

    return get_prompt(prompt_id, db)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(prompt_id: uuid.UUID, db: Session = Depends(get_db)):
    prompt = db.scalar(select(Prompt).where(Prompt.id == prompt_id))
    if prompt is None:
        return

    db.delete(prompt)
    db.commit()
