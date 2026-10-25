"""Imports every ORM model so ``Base.metadata`` is complete for Alembic and tests.

Add each new module's models here.
"""

from app.core.db import Base
from app.core.outbox import OutboxEvent
from app.modules.audit.models import AuditEvent
from app.modules.comments.models import Comment
from app.modules.content.models import Content, ContentSource, Source
from app.modules.identity.models import User
from app.modules.news.models import NewsItem

__all__ = [
    "AuditEvent",
    "Base",
    "Comment",
    "Content",
    "ContentSource",
    "NewsItem",
    "OutboxEvent",
    "Source",
    "User",
]
