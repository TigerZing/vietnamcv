# VietnamCV

Vietnamese-first Computer Vision knowledge and community platform: papers, open-source
code, news and learning resources with clear provenance, plus moderated community
contributions.

The product and engineering specification lives in [`specs/`](specs/README.md).
Architecture decisions are in [`docs/adr/`](docs/adr/), progress in
[`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

## Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Web        | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, next-intl (vi/en) |
| API        | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 + psycopg 3, Alembic |
| Jobs       | Celery 5 (Redis broker), RedBeat scheduler                         |
| Data       | PostgreSQL 17, Redis 7                                             |
| Tooling    | pnpm + Turborepo, uv, Ruff, mypy (strict), import-linter, Vitest, Playwright, pytest + testcontainers |

## Repository layout

```text
apps/web/              Next.js site (src/app/[locale]/…, messages/vi.json + en.json)
packages/api-client/   TypeScript client generated from the API's OpenAPI schema
packages/config/       Shared TypeScript configuration
services/api/          FastAPI app, Celery workers, Alembic migrations, tests
infra/docker/          Dockerfiles (one API image runs api, worker and beat)
infra/compose/         Local Docker Compose stack
docs/                  ADRs, runbooks, implementation status
specs/                 Product and engineering specification (read-only)
```

## Prerequisites

- Docker with Compose v2
- Node.js 22 and pnpm 10 (`corepack enable`)
- [uv](https://docs.astral.sh/uv/) 0.11+ (installs Python 3.12 automatically if missing)
- GNU Make

## Getting started

```bash
make bootstrap   # install dependencies, create .env from .env.example
make dev         # build and start postgres, redis, migrate, api, worker, beat, web
```

Then open:

- Web: <http://localhost:3000> (redirects to `/vi`)
- API docs: <http://localhost:8000/api/v1/docs>
- Readiness: <http://localhost:8000/api/v1/health/ready>

`make down` stops the stack; `make help` lists every target.

### Running services on the host

For faster feedback, run only the databases in Docker and the apps locally:

```bash
make infra       # postgres + redis
make migrate     # apply migrations
make api         # FastAPI with auto-reload on :8000
make web         # Next.js dev server on :3000
make worker      # Celery worker (optional)
```

## Quality checks

```bash
make lint        # ruff, mypy, import-linter, eslint, tsc, prettier
make test        # API tests (real PostgreSQL/Redis via testcontainers) + web unit tests
make e2e         # Playwright against a production build (360px and desktop, axe)
make openapi     # regenerate openapi.json and the TypeScript client after API changes
```

CI (`.github/workflows/ci.yml`) runs all of these on every pull request, plus Docker image
builds, OpenAPI drift detection, gitleaks and dependency audits.

## Development workflow

- One task per branch and pull request, named `<task-id>-<slug>` (for example `s1-02-content-schema`).
- Conventional Commits; squash merge into `main` after CI passes and review.
- Update `docs/IMPLEMENTATION_STATUS.md` in every PR; record decisions that change a spec as an ADR.
- Follow [`CLAUDE.md`](CLAUDE.md) when working with Claude Code.
