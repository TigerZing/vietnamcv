# ADR-009: Google sign-in and comments on news posts

- Status: Accepted (partially decides ADR-002: Google is the first identity provider)
- Date: 2026-10-25

## Context

The owner asked for news posts with a comment section where people can comment
anonymously, under a name they choose, or signed in with Google. ADR-002 planned a managed
OIDC provider by Sprint 3 and community comments are a P1 feature in
`specs/07-COMMUNITY.md`, which requires rate limits and abuse controls before broad
commenting. This ADR brings Google sign-in and comments forward for news posts only.

## Decision

**Identity.** Google is used directly as the OIDC provider, following ADR-002's target
design (backend-for-frontend):

- Next.js runs the authorization-code flow with PKCE, `state` and `nonce`
  (`/api/auth/google/login`, `/callback`, `POST /api/auth/logout`). Scope is
  `openid profile`; email is not requested.
- The Google ID token is kept in an httpOnly, SameSite=Lax cookie for its lifetime (one
  hour; then the user signs in again). It is never readable by browser JavaScript.
- Server-side calls send it as `Authorization: Bearer`. FastAPI verifies signature
  (Google JWKS, cached), issuer, audience (`GOOGLE_CLIENT_ID`) and expiry, and maps
  `google|<sub>` to `users.auth_subject`. Google users get the `member` role only.
- Moving to a managed provider later changes the web routes and `get_principal` only.

**Comments** (`comments` table, flat, newest first):

| Mode | Shown as | Published |
| --- | --- | --- |
| Anonymous | "Ẩn danh" | at once, unless it contains a link |
| Guest name | chosen name + "Khách" badge (unverified) | at once, unless body or name contains a link |
| Google | Google name and picture + verified badge | at once |

Abuse controls: Redis rate limits per client (3 per 5 minutes, 20 per day) and per
account (6 per 5 minutes, 60 per day); same text on the same post rejected for an hour;
honeypot field; reserved guest names (admin, moderator, quản trị, VietnamCV, ...);
control and bidi characters stripped; plain-text rendering only (no HTML or Markdown).
Client IPs are reduced to an HMAC with `CLIENT_FINGERPRINT_SECRET` and never stored raw.
uvicorn takes the visitor IP from `X-Forwarded-For` only for proxies in
`FORWARDED_ALLOW_IPS`; Compose trusts every address locally, production must list only
the web/proxy addresses.

Moderators list held comments and publish or hide them through
`/api/v1/admin/comments`; each action is an audit event.

## Consequences

- People can discuss posts without an account, with abuse limited by rate limits and the
  moderation queue rather than identity.
- Setup needs a Google Cloud OAuth client (Web application) with redirect URI
  `<site>/api/auth/google/callback`; without it the Google option is shown disabled.
- Not yet built: a moderation UI, reporting a comment, threaded replies, bans by
  fingerprint, and session renewal beyond one hour.
