# CLAUDE.md

Repository instructions for Claude Code. The engineering rules in
[`specs/CLAUDE.md`](specs/CLAUDE.md) are authoritative; this file adds what is specific to
this codebase.

## Before changing anything

1. Read `specs/CLAUDE.md`, the spec files relevant to the task, `docs/adr/` and
   `docs/IMPLEMENTATION_STATUS.md`.
2. Work on one task ID at a time, on its own branch; stop for review after each task.
3. If a spec conflicts with the code or another spec, write an ADR and ask; do not guess.

## Commands

| Purpose | Command |
| --- | --- |
| Install | `make bootstrap` |
| Full stack | `make dev` / `make down` |
| Lint + types | `make lint` |
| Tests | `make test` (API needs Docker for testcontainers) and `make e2e` |
| New migration | `make migration name="..."`, then review and edit the generated file |
| API contract | `make openapi` after any API schema change, commit both generated files |

## Backend conventions (`services/api`)

- Feature code lives in `app/modules/<module>/` with `models.py`, `schemas.py`,
  `service.py`, `repository.py`, `router.py`. Modules talk to each other only through
  `service.py`. `app/core` must not import modules (enforced by import-linter).
- Register every new model in `app/models.py` so Alembic sees it.
- Raise `app.core.errors` exceptions (`NotFoundError`, `ConflictError`, ...); never build
  error responses by hand. All errors use the envelope in `specs/04-API.md`.
- Protect endpoints with `CurrentPrincipal` / `require_role(...)` from `app.core.security`.
- Side effects after a commit go through the outbox (`app.core.outbox.record_event`) in the
  same transaction. Background tasks must be idempotent (`app.worker.idempotency`, unique
  constraints, upserts).
- Tests use real PostgreSQL and Redis; never SQLite, never live external APIs or LLMs.
- Every migration has a working `downgrade()`; `tests/integration/test_migrations.py`
  checks the round trip and model/migration drift.

## Frontend conventions (`apps/web`)

- All routes live under `src/app/[locale]/`. User-facing strings go in
  `messages/vi.json` and `messages/en.json` (same keys; a unit test enforces it).
  Vietnamese is the source language.
- Cache Components is on: keep pages statically prerenderable. Do not read headers or
  cookies outside `<Suspense>`; the locale comes from `next/root-params`.
- Server-side API calls go through `src/lib/api.ts` (typed client, `server-only`).
- Every data page needs loading, empty, error and not-found states; check 360px width,
  keyboard navigation and axe in Playwright.
- Next.js 16 differs from older versions: read `apps/web/AGENTS.md` and the docs in
  `node_modules/next/dist/docs/` before using an unfamiliar API.
