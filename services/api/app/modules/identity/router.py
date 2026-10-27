"""Admin sign-in (ADR-015). Accounts are created from the command line only."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from redis.asyncio import Redis

from app.core.config import Settings
from app.core.db import DbSession
from app.core.errors import ErrorEnvelope
from app.core.rate_limit import client_fingerprint
from app.core.security import Principal, Role, require_role
from app.modules.identity import service
from app.modules.identity.schemas import AdminLoginRequest, AdminMe, AdminSession

admin_router = APIRouter(prefix="/admin", tags=["admin"])

Admin = Annotated[Principal, Depends(require_role(Role.ADMIN))]


@admin_router.post(
    "/auth/login",
    response_model=AdminSession,
    summary="Sign in as an administrator with username and password",
    description=(
        "Returns a signed session token carrying the admin role. Wrong credentials give "
        "401 with the same message whether or not the username exists. Rate limited per "
        "client and per username."
    ),
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorEnvelope},
        status.HTTP_429_TOO_MANY_REQUESTS: {"model": ErrorEnvelope},
    },
)
async def admin_login(
    session: DbSession, request: Request, payload: AdminLoginRequest
) -> AdminSession:
    settings: Settings = request.app.state.settings
    redis: Redis = request.app.state.redis
    issued = await service.admin_login(
        session,
        redis,
        settings,
        username=payload.username,
        password=payload.password,
        fingerprint=client_fingerprint(request, settings),
    )
    return AdminSession(
        access_token=issued.token,
        expires_at=issued.expires_at,
        username=service.normalize_username(payload.username),
    )


@admin_router.get("/me", response_model=AdminMe, summary="The signed-in administrator")
async def admin_me(admin: Admin) -> AdminMe:
    return AdminMe(subject=admin.subject, username=admin.name)
