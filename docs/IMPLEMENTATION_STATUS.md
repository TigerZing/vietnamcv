# Implementation status

Updated after every task. A task is Done only with passing tests or demonstrated
behaviour. Plan: [Sprint 0–1 plan](https://claude.ai/artifact/5RodXoxVBbfzRcCkfs5WVi).

## Sprint 0: Foundation

| Task ID | Status | PR/Commit | Tests | Risks | Next action |
| --- | --- | --- | --- | --- | --- |
| S0-01 (FND-01) Repository scaffold | Done | Sprint 0 PR | `make bootstrap`, `make help` | None | — |
| S0-02 (FND-04) Config and env validation | Done | Sprint 0 PR | `tests/unit/test_config.py`, `apps/web/tests/unit/env.test.ts` | None | — |
| S0-03 API skeleton | Done | Sprint 0 PR | `test_errors.py`, `test_health.py` (unit + integration) | None | — |
| S0-04 (FND-05) Database baseline | Done | Sprint 0 PR | `test_migrations.py` (round trip, drift, unaccent), `test_outbox.py` | Extensions need CREATE privilege on managed hosts | Confirm with host (ADR-007) |
| S0-05 Worker skeleton | Done | Sprint 0 PR | `test_worker.py`, `test_idempotency.py`; beat + worker verified in Compose | None | — |
| S0-06 Auth seam and RBAC | Done | Sprint 0 PR | `test_security.py`, deployed-env refusal in `test_config.py` | Real OIDC pending ADR-002 | Choose provider by Sprint 3 |
| S0-07 (FND-06) Web shell and design tokens | Done | Sprint 0 PR | Vitest (states, messages, env); Playwright at 360px + 1280px incl. axe, keyboard, overflow, 404 | Vietnamese copy needs native review | Review `messages/vi.json` |
| S0-08 Typed API client | Done | Sprint 0 PR | `make openapi-check` in CI | None | — |
| S0-09 (FND-02) Docker Compose | Done | Sprint 0 PR | All 6 services healthy via `docker compose up --wait`; readiness 200; beat → worker outbox relay observed | None | — |
| S0-10 (FND-03) CI pipeline | In review | Sprint 0 PR | First run on the PR | Action versions unverified until first run | Enable branch protection on `main` |
| S0-11 (FND-05) ADRs and status | Done | Sprint 0 PR | — | ADR-002 and ADR-007 still Proposed | Decisions by Sprint 3 / end of Sprint 1 |

## Sprint 1: Canonical content and taxonomy

Not started. See the plan for tasks S1-01 … S1-10.

## Open decisions

- Auth provider (ADR-002), by Sprint 3.
- Hosting and region (ADR-007), staging by end of Sprint 1.
- LLM provider and monthly budget, by Sprint 3.
- Native-speaker review of Vietnamese UI copy and taxonomy labels.
