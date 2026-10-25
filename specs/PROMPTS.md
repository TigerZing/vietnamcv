# Claude Code Prompts — Execute One Phase at a Time

## Prompt 0 — Read and plan
```text
Read all files under specs/ in this repository, starting with specs/CLAUDE.md and specs/README.md. Do not write code yet. Summarize the MVP scope, architecture, key invariants, risks, and implementation dependencies. Identify any conflicting specifications. Propose ADR-001..005 and a concrete Sprint 0 execution plan with commands, files and tests. Ask only blocking questions; use documented defaults otherwise.
```

## Prompt 1 — Scaffold
```text
Implement only Sprint 0 tasks FND-01 through FND-06 in specs/09-DELIVERY.md. Follow specs/CLAUDE.md strictly. Create a working Next.js + FastAPI + PostgreSQL + Redis + Celery monorepo with Docker Compose, env examples, migrations, health endpoints, CI, design shell and tests. Use pinned dependency versions and no fake production credentials. Run lint, typecheck and tests. Report results, changed files, and next tasks. Stop after Sprint 0.
```

## Prompt 2 — Core domain
```text
Implement Sprint 1 CNT-01, CNT-02, TAX-01, API-01 and WEB-01. Follow specs/03-DATABASE.md and specs/04-API.md. Write migrations, domain validation, seed taxonomy, API tests and responsive UI. Ensure published imported content always has provenance. Do not start ingestion or AI enrichment yet. Run checks and update docs/IMPLEMENTATION_STATUS.md.
```

## Prompt 3 — Ingestion
```text
Implement Sprint 2 ING-01..ING-06 from specs/09-DELIVERY.md and specs/05-INGESTION.md. Build arXiv, GitHub and RSS adapters with rate limiting, checkpointing, raw payload persistence, replay-safe dedupe and Celery tasks. Use mock fixtures for tests; do not rely on external API availability in CI. Include operational metrics and failure tests. Stop after acceptance criteria pass.
```

## Prompt 4 — Search and enrichment
```text
Implement Sprint 3 AI-01, AI-02, MOD-01, SRCH-01, WEB-02. Use a provider-agnostic LLM interface with a deterministic mock. Do not publish ungrounded summaries. Build taxonomy filtering, PostgreSQL lexical search, task pages, and source labels. Include prompt-injection tests and evidence validation. Run all checks and report quality limitations.
```

## Prompt 5 — Community and admin
```text
Implement Sprint 4 AUTH-01, SUB-01, MOD-02, OPS-01, QA-01. Add OIDC JWT validation, backend RBAC, submissions, moderation audit and admin dashboard. All user submissions require review. Include SSRF/XSS/authorization tests and accessible UI states. Do not enable public comments yet.
```

## Prompt 6 — Beta launch audit
```text
Perform Sprint 5 REL-01..REL-05 readiness work, but DO NOT deploy production without explicit approval. Verify staging smoke tests, migration rollback, restore drill, source attribution, legal/takedown controls, rate limits, SLO measurements and operational dashboards. Produce a go/no-go report listing all blocking issues with evidence.
```

## Prompt for any follow-up task
```text
Implement only task <TASK_ID> from specs/09-DELIVERY.md. First inspect existing code and state the plan. Follow specs/CLAUDE.md. Add tests and docs. Run relevant checks, update implementation status, and stop after a concise change/test/risk report.
```
