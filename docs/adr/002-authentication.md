# ADR-002: Authentication and authorization

- Status: Proposed (provider to be chosen by Sprint 3)
- Date: 2026-10-25

## Context

`specs/02-ARCHITECTURE.md` requires OIDC: Next.js holds the browser session, FastAPI
validates bearer tokens (issuer, audience, signature via JWKS), no tokens in
localStorage. Auth (AUTH-01) is scheduled for Sprint 4, but admin endpoints and
moderation need an actor and RBAC from Sprint 2.

## Decision

- **Auth seam now (Sprint 0):** endpoints depend only on `Principal`, `CurrentPrincipal`
  and `require_role()` in `app/core/security.py`. Roles: `member` < `moderator` < `admin`
  (each implies the ones before).
- Until a provider exists, a development-only identity is selected with the
  `X-Dev-Principal` header when `DEV_AUTH_ENABLED=true`. Settings validation refuses that
  flag in staging and production, with a test proving it.
- **Target design (Sprint 4):** backend-for-frontend. Next.js keeps an httpOnly session
  cookie and attaches the access token on server-side calls; FastAPI validates the JWT
  against the provider's JWKS and maps `sub` to `users.auth_subject`. CSRF protection on
  cookie-authenticated mutations.
- **Provider (open):** recommended a managed OIDC provider with GitHub and Google login
  (for example Auth0, Clerk or Logto Cloud) over self-hosted Keycloak, to avoid operating
  an identity server. Decide by Sprint 3.

## Consequences

- Sprint 2–3 admin endpoints are built and tested with real 401/403 behaviour.
- Swapping in JWT validation changes `get_principal` only.
