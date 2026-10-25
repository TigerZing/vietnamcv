# ADR-005: Publishing policy

- Status: Accepted
- Date: 2026-10-25

## Context

`specs/05-INGESTION.md` and `specs/01-PRD.md` define who may publish what.

## Decision

| Origin | Path to publication |
| --- | --- |
| Trusted allowlisted connector, canonical metadata | Auto-publish after deterministic validation and provenance check |
| AI-generated summary or relation | Published only if schema-valid, source-grounded and above the quality gate; labelled "AI-generated"; otherwise review queue |
| Community submission | Always moderator approval |
| Ambiguous identity, unverified event/job, suspicious source, rights issue | Human review |

Content states: `draft → pending_review → published | rejected`, `published → archived`.
Every transition is an audit event. Archiving removes content from pages, search and
caches (outbox-driven revalidation). Demo fixtures use a `demo` source that the
production configuration rejects.

## Consequences

- The publish rules live in one service with policy tests (Sprint 3, MOD-01).
- No content reaches production without provenance or a human decision.
