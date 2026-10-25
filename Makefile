# VietnamCV developer entry point. Run `make help` for the list of targets.

SHELL := /bin/bash
API_DIR := services/api
COMPOSE := docker compose -f infra/compose/compose.yaml $(if $(wildcard .env),--env-file .env,)
UV := uv --directory $(API_DIR)

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available targets
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

## Setup

.PHONY: bootstrap
bootstrap: ## Install all dependencies (pnpm + uv) and create .env from the example
	@test -f .env || cp .env.example .env
	pnpm install --frozen-lockfile
	$(UV) sync --frozen

## Local stack

.PHONY: dev
dev: ## Build and start the full stack in Docker (web :3000, api :8000)
	$(COMPOSE) up --build --wait
	@echo "Web: http://localhost:3000  API docs: http://localhost:8000/api/v1/docs"

.PHONY: down
down: ## Stop the stack (keeps database volumes)
	$(COMPOSE) down

.PHONY: logs
logs: ## Follow logs from all services
	$(COMPOSE) logs -f

.PHONY: infra
infra: ## Start only PostgreSQL and Redis (for running api/web on the host)
	$(COMPOSE) up -d --wait postgres redis

.PHONY: api
api: ## Run the API on the host with auto-reload (needs `make infra` and .env)
	set -a && source .env && set +a && $(UV) run uvicorn app.asgi:app --reload --port 8000

.PHONY: worker
worker: ## Run a Celery worker on the host
	set -a && source .env && set +a && $(UV) run celery -A app.worker.celery_app worker -Q default,fetch,enrich,publish --loglevel INFO

.PHONY: web
web: ## Run the Next.js dev server on the host
	set -a && source .env && set +a && pnpm --filter @vietnamcv/web dev

## Database

.PHONY: migrate
migrate: ## Apply all migrations to the database in DATABASE_URL
	set -a && source .env && set +a && $(UV) run alembic upgrade head

.PHONY: migration
migration: ## Create a migration: make migration name="add contents table"
	@test -n "$(name)" || (echo 'usage: make migration name="describe change"' && exit 1)
	set -a && source .env && set +a && $(UV) run alembic revision --autogenerate -m "$(name)"

## Quality

.PHONY: lint
lint: ## Lint and type-check everything
	$(UV) run ruff check .
	$(UV) run ruff format --check .
	$(UV) run mypy .
	$(UV) run lint-imports
	pnpm lint
	pnpm typecheck
	pnpm format:check

.PHONY: format
format: ## Auto-format Python and TypeScript
	$(UV) run ruff check --fix .
	$(UV) run ruff format .
	pnpm format

.PHONY: test
test: test-api test-web ## Run all unit and integration tests

.PHONY: test-api
test-api: ## Run API tests (starts throwaway PostgreSQL/Redis containers)
	$(UV) run pytest --cov

.PHONY: test-web
test-web: ## Run web unit tests
	pnpm test

.PHONY: e2e
e2e: ## Run Playwright end-to-end tests against a production build
	pnpm --filter @vietnamcv/web build
	pnpm --filter @vietnamcv/web e2e

## API contract

.PHONY: openapi
openapi: ## Regenerate services/api/openapi.json and the TypeScript API client
	$(UV) run python -m app.cli.export_openapi
	pnpm --filter @vietnamcv/api-client generate
	pnpm prettier --write packages/api-client/src/schema.d.ts > /dev/null

.PHONY: openapi-check
openapi-check: openapi ## Fail if the committed OpenAPI schema or client is stale
	git diff --exit-code -- $(API_DIR)/openapi.json packages/api-client/src/schema.d.ts
