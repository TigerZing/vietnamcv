# 10 — Security, QA, Deployment and Runbooks

## Security baseline
OWASP ASVS-inspired checklist: OIDC token verification, server RBAC, CSRF if cookies, XSS-safe Markdown, SQL parameterization, rate limits, upload limits, SSRF-safe URL fetch, dependency scanning, secret scanning, TLS, least privilege, audit logs. Treat crawler data and LLM outputs as untrusted.

## Privacy and rights
Collect minimal user profile data. Provide privacy policy, terms, contact and takedown mechanism. Store metadata and allowed excerpts rather than copyrighted full articles. Record source terms, attribution, canonical URL and last-fetch time. Plan deletion/anonymization workflow and retention policy before public signups.

## Tests
- Unit: validators, taxonomy, dedupe, ranking, permission checks.
- Integration: migrations, DB repositories, ingestion replay, moderation transactions.
- Contract: OpenAPI response models, connector adapters with recorded fixtures.
- E2E: visitor search -> detail -> original link; member submit -> moderator approve -> public result; reject -> not visible.
- Security: JWT wrong issuer/audience, SSRF private IP/redirect, XSS payload, SQL injection, rate limits.
- Performance: representative feed/search load, ingestion backlog recovery, database query plans.

## Observability
Structured logs with request_id/job_id/source_id; never log secrets or raw personal data. Metrics: fetch success rate, new/duplicate records, enrichment failures, queue age, review queue age, publish latency, API p95, search p95. Tracing across API -> worker where possible.

## SLO targets (validate)
Availability 99.5% monthly; public read API p95 <500ms excluding external AI; search p95 <800ms at defined load; 90% new supported-source items discovered <6h, subject to upstream availability. These are proposed targets, not measured guarantees.

## Release procedure
1. CI green; 2. migration backup/snapshot; 3. staging deploy; 4. smoke and security checks; 5. human approval; 6. production deploy; 7. monitor error rate/latency/queues; 8. rollback app if needed. Database migrations must be backward compatible for rolling deployment when possible.

## Incident runbooks
- Connector 429: pause/reduce concurrency, honor Retry-After, inspect quota.
- Connector 5xx: retry/backoff, retain last successful checkpoint.
- LLM outage: publish verified metadata only, queue summaries for later.
- Duplicate false merge: unmerge via audit/provenance, rebuild indexes.
- Malicious content: unpublish, invalidate caches, investigate audit.
- Database incident: restore from verified backup, reconcile checkpoints, replay idempotent tasks.

## Budget controls
LLM monthly token budget, per-source fetch quota, alert thresholds, maximum worker concurrency and storage lifecycle. No GPU hosting in MVP. Estimate costs only after vendor and traffic assumptions are specified.
