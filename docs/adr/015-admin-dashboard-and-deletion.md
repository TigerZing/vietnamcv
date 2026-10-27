# ADR-015: Admin dashboard with password sign-in, and deleting content

- Status: Accepted
- Date: 2026-10-27
- Partly decides: [ADR-002](002-authentication.md) for administrators only

## Context

The owner asked for a dashboard where they sign in as administrator and delete any post
they want. ADR-002 leaves the identity provider open until Sprint 3, and Google sign-in
(ADR-009) only makes members. The site shows three kinds of user-visible items: news
posts and demo products (both `contents` rows) and comments. The curated imports
(`seed_news`, `seed_demos`) run on every `scripts/run.sh update` and publish every listed
item again, so a plain delete or archive would come back on the next update.

## Decision

**Admin accounts.** A new `admin_accounts` table (username, scrypt hash, last sign-in).
Accounts are created only from the command line, `python -m app.cli.create_admin NAME`
(`scripts/run.sh admin` wraps it); there is no sign-up endpoint. Passwords are 10–256
characters and hashed with scrypt (N=2^15, r=8, p=1, 16-byte salt) from the standard
library, stored as `scrypt$n$r$p$salt$hash` so the cost can be raised later.

**Sign-in.** `POST /api/v1/admin/auth/login` checks the password (constant-time compare;
an unknown username is checked against a dummy hash and gets the same 401) and returns a
token signed by the API with `ADMIN_TOKEN_SECRET` (HS256, `iss=vietnamcv-admin`,
`aud=vietnamcv-api`, `sub=admin|<account id>`, 8 hours). Attempts are rate limited per
client fingerprint and per username (10 per 15 minutes each) and audited.
`get_principal` tells admin tokens from Google tokens by the unverified `iss` claim, then
verifies fully (signature with the expected algorithm only, issuer, audience, expiry);
an admin token gives the `admin` role. The secret must be at least 32 characters and is
required outside local/test.

**Web.** `/[locale]/admin` (not linked from the menus, `noindex`) shows the login form or
the dashboard. Login, logout and every delete are Server Actions; Next.js checks their
Origin. The token lives in an httpOnly, `SameSite=Strict` cookie (`Secure` on https) for
its lifetime and is never readable by browser JavaScript; the web forwards it as a
bearer token on server-side calls, as for Google (ADR-009).

**Deleting.**

| Item | Endpoint (admin role) | Effect |
| --- | --- | --- |
| News post, demo | `DELETE /api/v1/admin/contents/{id}` | status `removed`: off every public list and page, images no longer served |
| Deleted post or demo | `POST /api/v1/admin/contents/{id}/restore` | published again |
| Comment | `DELETE /api/v1/admin/comments/{id}` | row deleted; the audit event keeps its text |

`removed` is a new content status. `PublishService.publish` and `archive` leave removed
content alone, so the imports never bring it back; only restore does. The demo page is
still rendered from `apps/web/src/lib/demos.ts`, so it now asks `GET /api/v1/demos` for
the published demo slugs at request time and leaves the others out (if the API cannot be
reached it shows the full list rather than an empty page). Every removal, restore and
comment deletion is an audit event with the admin's subject.

## Consequences

- The owner can delete any news post, demo or comment from the browser, and undo a
  mistaken post or demo deletion. Deleted comments cannot be restored.
- The demo list and watch page are now partly rendered at request time.
- A token stays valid until it expires (8 hours) even if the account is deleted or its
  password changes; changing `ADMIN_TOKEN_SECRET` signs every admin out at once.
- When a managed provider replaces Google (ADR-002), admins can move to it; the
  endpoints depend only on `require_role(Role.ADMIN)`.
- Not built: several admin roles, editing posts, two-factor sign-in.
