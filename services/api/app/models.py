"""Imports every ORM model so ``Base.metadata`` is complete for Alembic and tests.

Add each new module's models here.
"""

from app.core.db import Base
from app.core.outbox import OutboxEvent

__all__ = ["Base", "OutboxEvent"]
