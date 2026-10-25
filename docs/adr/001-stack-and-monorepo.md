# ADR-001: Technology stack and monorepo layout

- Status: Accepted
- Date: 2026-10-25

## Context

`specs/CLAUDE.md` and `specs/02-ARCHITECTURE.md` fix the main stack (Next.js, FastAPI,
PostgreSQL, Redis, Celery, modular monolith). They leave tooling, drivers and layout open.

## Decision

- One repository. JavaScript workspaces with **pnpm + Turborepo** (`apps/*`, `packages/*`);
  Python managed by **uv** in `services/api`. A root `Makefile` is the single entry point.
- **Next.js 16** App Router with **Cache Components**, React 19, TypeScript strict,
  Tailwind CSS v4, shadcn/ui conventions (`components.json`), next-intl.
- **FastAPI** + Pydantic v2 + **SQLAlchemy 2** with **psycopg 3** as the only driver:
  async sessions in the API, sync sessions in Celery and Alembic, one connection URL.
- **PostgreSQL 17** (spec said 16; 17 is widely available on managed hosts and has a longer
  support window). Extensions: `pg_trgm`, `unaccent`, `citext`.
- **Celery 5** with Redis, `acks_late`, JSON only, queues `default`, `fetch`, `enrich`,
  `publish`, and **RedBeat** as the beat scheduler for its Redis lock.
- One API Docker image runs the API, worker and beat with different commands.
- Module boundaries in the backend are enforced by **import-linter** in CI.
- The web app talks to the API through a TypeScript client generated from OpenAPI
  (`packages/api-client`); CI fails when the committed schema or client is stale.
- Exact versions are pinned in `pnpm-lock.yaml` and `services/api/uv.lock`.

## Consequences

- One build produces three backend processes; domain code is written once.
- Two package managers to learn, hidden behind `make` targets.
- TypeScript is pinned to 5.9 because `typescript-eslint` and `openapi-typescript` do not
  yet support 6.x/7.x; revisit when they do.
- ESLint is pinned to 9.x (what `create-next-app` 16.4 generates) although 9.x is marked
  deprecated upstream; move to 10 once `eslint-config-next` supports it.
