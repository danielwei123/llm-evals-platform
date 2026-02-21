from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Prompt, Run
from app.schemas.run import RunCreateIn, RunOut

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=RunOut, status_code=status.HTTP_201_CREATED)
def create_run(payload: RunCreateIn, db: Session = Depends(get_db)):
    prompt = db.scalar(select(Prompt).where(Prompt.name == payload.prompt_name))
    if prompt is None:
        raise HTTPException(status_code=404, detail="prompt not found")

    run = Run(
        prompt_id=prompt.id,
        prompt_version=prompt.active_version,
        status="queued",
        input=payload.input,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return run


@router.get("", response_model=list[RunOut])
def list_runs(
    prompt_id: uuid.UUID | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Run).order_by(Run.created_at.desc()).limit(limit).offset(offset)
    if prompt_id is not None:
        stmt = stmt.where(Run.prompt_id == prompt_id)

    return list(db.scalars(stmt).all())


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: uuid.UUID, db: Session = Depends(get_db)):
    run = db.scalar(select(Run).where(Run.id == run_id))
    if run is None:
        raise HTTPException(status_code=404, detail="run not found")
    return run
