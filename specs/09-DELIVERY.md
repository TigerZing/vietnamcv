# 09 — Delivery Plan, Epics and Sprint Backlog

## Working assumption
2–3 experienced developers, 10–12 weeks, 2-week sprints. Estimates are planning ranges; adjust after Sprint 0. Keep each PR reviewable. IDs are stable backlog references.

## Sprint 0 (week 1–2): Foundation
- FND-01 [P0] Repo monorepo scaffold (`apps/web`, `services/api`, `infra`, `docs`). AC: local bootstrap documented and reproducible.
- FND-02 [P0] Docker Compose PostgreSQL/Redis/API/web/worker/beat. AC: `docker compose up` healthy.
- FND-03 [P0] Python/TS lint, typecheck, unit-test CI. AC: PR fails on broken checks.
- FND-04 [P0] Environment validation and `.env.example`. AC: missing env fails clearly; no secrets committed.
- FND-05 [P0] ADR-001..005; migration baseline. AC: DB upgrade and downgrade tested.
- FND-06 [P0] Design tokens, navigation, layout shell. AC: responsive and accessible.

## Sprint 1 (week 3–4): Canonical content and taxonomy
- CNT-01 [P0] Contents + sources + provenance schema. AC: publish requires valid source.
- CNT-02 [P0] Paper and repository specialization. AC: external IDs unique.
- TAX-01 [P0] Taxonomy dimensions/nodes/aliases seeds. AC: hierarchy validation and multilingual labels.
- API-01 [P0] `/contents`, `/papers`, `/repositories`, `/taxonomy` GET. AC: OpenAPI, filters, pagination, tests.
- WEB-01 [P0] Homepage, paper list/detail, repo list. AC: loading/empty/error states.

## Sprint 2 (week 5–6): Data ingestion
- ING-01 [P0] Connector interface and source registry. AC: mock and live adapters share contract.
- ING-02 [P0] arXiv connector. AC: cursor, replay, failure handling tested.
- ING-03 [P0] GitHub connector. AC: repo ID survives rename; rate limits handled.
- ING-04 [P0] RSS connector. AC: canonical URL, dates, source attribution.
- ING-05 [P0] Raw payload/checkpoint/job monitoring. AC: no data loss after worker restart.
- ING-06 [P0] Strong-identity dedupe. AC: replay does not duplicate published content.

## Sprint 3 (week 7–8): Enrichment and discovery
- AI-01 [P0] Relevance filter and controlled taxonomy mapping. AC: only known node IDs.
- AI-02 [P0] AI summary adapter with schema validation, evidence and versioning. AC: bad output quarantined.
- MOD-01 [P0] Publish policy with trusted metadata auto-publish and review queue. AC: policy tests.
- SRCH-01 [P0] PostgreSQL lexical search, filters, stable pagination. AC: query safety and relevant fixture results.
- WEB-02 [P0] Discover, task explorer, search, news pages. AC: URLs shareable, no empty broken states.

## Sprint 4 (week 9–10): Community-lite and admin
- AUTH-01 [P0] OIDC/JWT auth and RBAC. AC: 401/403 and JWT validation tests.
- SUB-01 [P0] Submission endpoint/form/status. AC: duplicate/safety validation and owner access.
- MOD-02 [P0] Review UI, approve/reject, audit log. AC: unauthorized moderation forbidden.
- OPS-01 [P0] Ingestion admin health/retry. AC: failed jobs visible and actionable.
- QA-01 [P0] Accessibility, SEO, security hardening. AC: checklist passes.

## Sprint 5 (week 11–12): Beta readiness
- REL-01 [P0] Staging deployment and smoke tests.
- REL-02 [P0] Restore drill, source policy review, takedown process.
- REL-03 [P0] Load tests, ingestion SLO dashboards and alerts.
- REL-04 [P0] Content quality sampling, editorial review, launch checklist.
- REL-05 [P0] Production launch only after explicit human approval.

## P1 backlog
COM-01 profiles; COM-02 bookmarks; COM-03 comments/reports; LRN-01 roadmap CMS; EVT-01 event directory; JOB-01 jobs directory; NTF-01 topic digest; MOD-03 appeals.

## Cross-cutting Definition of Done for every task
Implementation + tests + API/schema documentation + empty/error states + security checks + migration if required + PR notes. No `TODO` masquerading as delivered functionality.

## Dependency chain
FND -> CNT/TAX -> ING -> AI/SRCH -> AUTH/SUB/MOD -> RELEASE. UI can progress in parallel using typed fixtures, then replace with real APIs.

## Status tracking
Create `docs/IMPLEMENTATION_STATUS.md` with columns Task ID, Status, PR/Commit, Tests, Risks, Next Action. Update after each Claude session. Never mark completed without tests or demonstrated behavior.
