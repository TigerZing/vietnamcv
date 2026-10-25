# 03 — Database Design and Migration Plan

## Core entities
- `users(id, auth_subject UNIQUE, username UNIQUE, display_name, status, created_at)`
- `roles(id, code UNIQUE)`, `user_roles(user_id, role_id)`
- `contents(id, type, slug UNIQUE, title, summary, language, status, author_id NULL, published_at, created_at, updated_at, version)`
- `papers(content_id PK/FK, arxiv_id UNIQUE NULL, doi UNIQUE NULL, abstract, venue, publication_year)`
- `repositories(content_id PK/FK, provider, provider_repo_id, owner, repo_name, default_branch, license_spdx NULL, stars_count NULL, stars_observed_at NULL, UNIQUE(provider,provider_repo_id))`
- `sources(id, code UNIQUE, kind, base_url, trust_tier, enabled, terms_url NULL, created_at)`
- `content_sources(id, content_id, source_id, external_id, canonical_url, fetched_at, source_published_at, raw_item_id NULL, UNIQUE(source_id,external_id))`
- `ingestion_runs(id, source_id, status, started_at, ended_at, cursor_before, cursor_after, fetched_count, accepted_count, error_count)`
- `ingestion_items(id, run_id, source_id, external_id, payload_hash, raw_payload JSONB, status, error NULL, UNIQUE(source_id,external_id,payload_hash))`
- `source_checkpoints(source_id PK, cursor, last_success_at)`
- `taxonomy_dimensions(id, code UNIQUE, label)`
- `taxonomy_nodes(id, dimension_id, parent_id NULL, slug, label_en, label_vi, active, UNIQUE(dimension_id,slug))`
- `taxonomy_aliases(id, node_id, language, alias, UNIQUE(node_id,language,alias))`
- `content_taxonomy(content_id, node_id, origin, confidence NULL, model_version NULL, reviewer_id NULL, PRIMARY KEY(content_id,node_id))`
- `content_relations(id, source_content_id, target_content_id, relation_type, origin, confidence NULL, UNIQUE(source_content_id,target_content_id,relation_type))`
- `submissions(id, submitter_id, proposed_type, submitted_url, payload JSONB, content_id NULL, status, review_reason NULL, created_at, reviewed_at NULL)`
- `moderation_actions(id, actor_id, target_type, target_id, action, reason, before JSONB, after JSONB, created_at)`
- `enrichment_jobs(id, content_id, stage, status, input_hash, provider, model_version, prompt_version, output JSONB, error NULL, created_at)`
- P1: `comments`, `bookmarks`, `topic_follows`, `reports`, `events`, `jobs`, `tutorials`, `roadmaps`.

## Invariants
- Every published imported content must have at least one `content_sources` record (enforce in publish service transaction).
- No two contents share the same strong external identity. External source IDs scoped to source; DOI/arXiv uniqueness where known.
- `published_at` is null until first publication; preserve original source publication timestamp separately.
- A child taxonomy node must belong to the same dimension as its parent; prevent cycles via application validation and tests.
- `content_relations` disallow self-edges; validate allowed relation types by source/target type.
- Never cascade-delete users into public authored content; use anonymization/soft deletion policy.
- Review actions and publish/unpublish are atomic and audited.
- Enrichment outputs are immutable snapshots keyed by input hash and version.

## Indexes
- `contents(status,type,published_at DESC,id DESC)` for feed.
- GIN `to_tsvector('simple', title || ' ' || summary)` for baseline search; assess Vietnamese normalization and trigram indexes.
- `content_taxonomy(node_id,content_id)`; `content_sources(source_id,external_id)`.
- `ingestion_items(status,run_id)`; `submissions(status,created_at)`.
- Partial indexes on published content and pending submissions.

## Migration sequence
M001 identity/roles; M002 contents/sources; M003 paper/repository specializations; M004 taxonomy; M005 ingestion; M006 submissions/moderation; M007 search indexes; M008 audit/enrichment. Every migration needs integration tests on empty DB and upgrade from previous version. Use seeded taxonomy and demo fixtures separately from migrations.

## Query correctness
Use keyset pagination for chronological feeds (`published_at,id`); deterministic tie-breaking. Store UTC timestamps; display in user's locale. Parameterize queries. Prevent N+1 through eager loading. Use transactions for publish + provenance + audit.
