# ADR-006: Background job idempotency and transactional outbox

- Status: Accepted (implemented in Sprint 0)
- Date: 2026-10-25

## Context

Celery with Redis delivers at least once (`acks_late`, visibility timeout, worker crashes).
The architecture requires durable side effects without pretending in-memory callbacks
are reliable.

## Decision

- **Outbox:** side effects that follow a database change are written to `outbox_events`
  in the same transaction (`record_event`). The `relay_outbox` task (every 30 s via beat,
  `publish` queue) dispatches pending events with `SELECT … FOR UPDATE SKIP LOCKED`,
  retries failures up to 10 times and keeps the last error for inspection.
- **Idempotency:** every task is safe to run twice. Database writes rely on unique
  constraints and upserts; side effects outside the database use `run_once()` (Redis lock
  plus a completion marker written only after success).
- **Checkpoints** for connectors advance only after raw items are durably stored
  (Sprint 2).
- **Beat** runs as a single replica and uses RedBeat's Redis lock as a second guard.

## Consequences

- Events are delivered at least once; handlers must tolerate duplicates.
- Up to ~30 s latency between commit and side effect, acceptable for cache revalidation.
