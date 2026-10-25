# ADR-004: Search on PostgreSQL

- Status: Accepted (column in Sprint 1, tuning in Sprint 3)
- Date: 2026-10-25

## Context

The spec's baseline index `to_tsvector('simple', title || ' ' || summary)` returns NULL
when `summary` is NULL and does not match Vietnamese text typed without diacritics.

## Decision

- Use a stored generated `search_vector` column on `contents`:
  `setweight(to_tsvector('simple', immutable_unaccent(coalesce(title, ''))), 'A') ||
  setweight(to_tsvector('simple', immutable_unaccent(coalesce(summary, ''))), 'B')`,
  with a GIN index. Queries are unaccented the same way.
- `immutable_unaccent()` (baseline migration 0001) wraps `unaccent` with a fixed
  dictionary so it can be used in generated columns and indexes.
- `pg_trgm` index on titles for fuzzy and partial matches.
- Before any change in ranking or a move to pgvector or an external engine, measure against
  a fixed set of about 50 real queries (Vietnamese, English and mixed).

## Consequences

- No extra infrastructure for MVP; search stays transactionally consistent with content.
- `simple` configuration means no stemming; acceptable for Vietnamese (no inflection) and
  technical English terms, revisited with the evaluation set.
