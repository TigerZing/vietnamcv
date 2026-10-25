"""Records audit events inside the caller's transaction."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditEvent


def record(
    session: AsyncSession,
    *,
    actor_subject: str,
    action: str,
    target_type: str,
    target_id: uuid.UUID,
    reason: str | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> AuditEvent:
    event = AuditEvent(
        id=uuid.uuid4(),
        actor_subject=actor_subject,
        action=action,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        before=before,
        after=after,
    )
    session.add(event)
    return event
