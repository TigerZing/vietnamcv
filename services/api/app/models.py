"""Imports every ORM model so ``Base.metadata`` is complete for Alembic and tests.

Add each new module's models here.
"""

from app.core.db import Base
from app.core.outbox import OutboxEvent
from app.modules.audit.models import AuditEvent
from app.modules.comments.models import Comment
from app.modules.content.models import (
    Content,
    ContentLink,
    ContentMedia,
    ContentSource,
    ContentTranslation,
    Source,
)
from app.modules.identity.models import AdminAccount, User
from app.modules.media.models import MediaAsset
from app.modules.news.models import NewsItem

__all__ = [
    "AdminAccount",
    "AuditEvent",
    "Base",
    "Comment",
    "Content",
    "ContentLink",
    "ContentMedia",
    "ContentSource",
    "ContentTranslation",
    "MediaAsset",
    "NewsItem",
    "OutboxEvent",
    "Source",
    "User",
]
