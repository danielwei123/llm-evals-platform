from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field
from pydantic.config import ConfigDict


class PromptVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    prompt_id: uuid.UUID
    version: int
    content: str
    parameters: dict | None = None
    created_at: datetime


class PromptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    active_version: int
    latest_version: PromptVersionOut | None = None


class PromptDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    active_version: int
    versions: list[PromptVersionOut]


class PromptResolvedOut(BaseModel):
    """Prompt resolved to its currently-active version.

    Useful for runners/execution: you usually want a stable name, but you need
    immutable content+parameters at the active version.
    """

    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    active_version: int
    active: PromptVersionOut


class PromptCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    content: str = Field(min_length=1)
    parameters: dict | None = None


class PromptUpdateIn(BaseModel):
    description: str | None = None


class PromptVersionCreateIn(BaseModel):
    content: str = Field(min_length=1)
    parameters: dict | None = None


class PromptActivateIn(BaseModel):
    version: int = Field(ge=1)
