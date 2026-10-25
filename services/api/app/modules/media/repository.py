"""Media queries."""

from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import undefer

from app.modules.media.models import MediaAsset


async def find_by_sha256(session: AsyncSession, sha256: str) -> MediaAsset | None:
    found: MediaAsset | None = await session.scalar(
        select(MediaAsset).where(MediaAsset.sha256 == sha256)
    )
    return found


async def get(session: AsyncSession, media_id: uuid.UUID) -> MediaAsset | None:
    return await session.get(MediaAsset, media_id)


async def get_with_data(session: AsyncSession, media_id: uuid.UUID) -> MediaAsset | None:
    found: MediaAsset | None = await session.scalar(
        select(MediaAsset).where(MediaAsset.id == media_id).options(undefer(MediaAsset.data))
    )
    return found


async def get_many(
    session: AsyncSession, media_ids: Sequence[uuid.UUID]
) -> dict[uuid.UUID, MediaAsset]:
    if not media_ids:
        return {}
    rows = await session.scalars(select(MediaAsset).where(MediaAsset.id.in_(media_ids)))
    return {row.id: row for row in rows}
