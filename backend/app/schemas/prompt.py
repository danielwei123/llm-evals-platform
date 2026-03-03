from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator
from pydantic.config import ConfigDict


_NAME_ALLOWED = set("abcdefghijklmnopqrstuvwxyz0123456789_-./")


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
    tags: list[str] = []
    created_at: datetime
    active_version: int
    latest_version: PromptVersionOut | None = None


class PromptDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str | None = None
    tags: list[str] = []
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
    tags: list[str] = []
    created_at: datetime
    active_version: int
    active: PromptVersionOut


class PromptCreateIn(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200,
        description="Stable prompt identifier (lowercase). Example: support/reply_v1",
    )
    description: str | None = None
    tags: list[str] | None = None
    content: str = Field(min_length=1)
    parameters: dict | None = None

    @field_validator("name")
    @classmethod
    def _validate_and_normalize_name(cls, v: str) -> str:
        name = v.strip().lower()
        if name == "":
            raise ValueError("name cannot be empty")

        bad = sorted({ch for ch in name if ch not in _NAME_ALLOWED})
        if bad:
            raise ValueError(
                "name contains invalid characters; allowed: a-z 0-9 _ - . /"
            )

        if not ("a" <= name[0] <= "z"):
            raise ValueError("name must start with a letter")

        if "//" in name:
            raise ValueError("name cannot contain '//'")
        if name.endswith("/"):
            raise ValueError("name cannot end with '/'")

        return name


class PromptUpdateIn(BaseModel):
    description: str | None = None
    tags: list[str] | None = None


class PromptVersionCreateIn(BaseModel):
    content: str = Field(min_length=1)
    parameters: dict | None = None


class PromptActivateIn(BaseModel):
    version: int = Field(ge=1)
