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
make dev         # build and start postgres, redis, migrate, seed, api, worker, beat, web
```

Then open:

- Web: <http://localhost:3000> (redirects to `/vi`)
- API docs: <http://localhost:8000/api/v1/docs>
- Readiness: <http://localhost:8000/api/v1/health/ready>

`make down` stops the stack; `make help` lists every target.

Or do it in one command: `scripts/run.sh` checks that Docker (Docker Desktop or Colima,
which it starts if needed) and Compose v2 are available, creates `.env` if missing, checks
that ports 3000/8000/5432/6379 are free, starts the stack and prints the URLs. Add `--open`
to open the site; `scripts/run.sh down`, `logs` and `status` do what they say.

The containers run the code baked into their images, so new commits need a rebuild.
`scripts/run.sh update` pulls, rebuilds only the images whose inputs changed (API, web, or
none for docs-only commits) and restarts them; migrations and the news import re-run.

`scripts/run.sh admin` creates the administrator account (or sets a new password) and
asks for the password; sign in at <http://localhost:3000/vi/admin> to delete news posts,
demos or comments (ADR-015). Set `ADMIN_TOKEN_SECRET` in `.env` before deploying.

### Running services on the host

For faster feedback, run only the databases in Docker and the apps locally:

```bash
make infra       # postgres + redis
make migrate     # apply migrations
make seed        # import the editor-approved news posts
make api         # FastAPI with auto-reload on :8000
make web         # Next.js dev server on :3000
make worker      # Celery worker (optional)
```

### News posts and comments

`make dev` imports the editor-approved news in `services/api/seed/news/*.json` (exported
from the news sheet) and publishes them at <http://localhost:3000/vi/news>. The import is
idempotent: edit a file and run `make seed-docker` (or `make seed` on the host) to update.

Each post has Vietnamese and English text (switch with VI/EN), an image and the source
with related links at the end. The list shows 15 posts, as a list (default) or as cards
with 2-4 columns (`?view=grid&cols=3`). Source images are downloaded once by the import
and stored in PostgreSQL; they are marked `permission_pending` and only show locally
until the source agrees (ADR-010). If a download fails, the import logs
`news_image_not_loaded` and retries on the next run.

Comments can be posted anonymously, with a chosen name, or with a Google account.
Google sign-in is off until you set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in
`.env` (see ADR-009 for creating the OAuth client), then `make down && make dev`.

Moderation has no UI yet. Locally, use the API docs with the `X-Dev-Principal: moderator`
header: `GET /api/v1/admin/comments` lists held comments and
`POST /api/v1/admin/comments/{id}/moderate` publishes or hides one.

### Discover picks

The Discover tab (<http://localhost:3000/vi/discover>) lists links from the owner's
`Khám phá CV` Google Sheet. Claude syncs the approved rows into
`apps/web/src/content/discover.json` in a pull request (ADR-016); after merging, run
`scripts/run.sh update`.

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
