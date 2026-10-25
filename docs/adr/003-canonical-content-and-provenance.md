# ADR-003: Canonical content and provenance

- Status: Accepted (schema lands in Sprint 1)
- Date: 2026-10-25

## Context

`specs/03-DATABASE.md` defines `contents` with type-specific tables and `content_sources`
for provenance. The architecture review found gaps: no table for news, no paper authors,
no place for published summaries, unclear abstract vs summary, audit arriving too late.

## Decision

- `contents` is the canonical record for every resource type; `papers`, `repositories`
  and **`news_items`** hold type-specific fields (`news_items` added).
- **`paper_authors(content_id, position, name, affiliation)`** stores ordered authors;
  person entities stay a P2 feature.
- `papers.abstract` keeps the original text (English preserved). `contents.summary` is
  short card text. AI or editor summaries live in **`content_summaries`**
  (language, body, origin `human|ai`, enrichment job, status) so pages can label
  AI-generated text.
- A generic **`audit_events`** table arrives with contents in Sprint 1, because publishing
  must be audited from the first publish. Moderation actions are audit events.
- `sources` also stores terms URL, rate limit, usage restrictions and attribution text;
  `contents` stores takedown status. **`slug_redirects`** keeps retired slugs working.
- Publishing goes through one `PublishService` that, in one transaction, checks at least
  one valid `content_sources` row, sets `published_at` on first publish, writes the audit
  event and records an outbox event.

## Consequences

- Sprint 1 migrations are larger than M002/M003 in the spec but nothing is retrofitted.
- Every published external record can show where it came from and when it was fetched.
