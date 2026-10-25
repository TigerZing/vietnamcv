# 05 — Ingestion and AI Enrichment

## Pipeline state machine
`discovered -> fetched -> normalized -> deduplicated -> relevant -> enriched -> validated -> pending_review|publishable -> published|rejected`. Failure paths: `retry_wait`, `dead_letter`, `quarantined`. Store transition timestamp and error details.

## Source adapters
Interface: `fetch(cursor, limit) -> Batch[RawRecord]`; `normalize(raw) -> CanonicalCandidate`; `identify(candidate) -> ExternalIdentity`; `source_policy() -> TermsAndRateLimit`. Implement arXiv, GitHub and RSS first; Hugging Face fourth. Prefer official APIs and RSS over HTML scraping. Source allowlist with terms and quotas.

## Scheduling
- arXiv 3–6h; GitHub 6–12h; RSS 3–6h, subject to quotas and policies.
- Celery Beat schedules fetch; tasks enqueue normalize, dedupe, relevance, enrichment, publish/index.
- Redis queues: `fetch`, `enrich`, `index`; independent concurrency/rate limits.
- Advance checkpoints only after durable raw item persistence. Use overlap windows and dedupe to avoid gaps.

## Identity/dedupe
1. Normalize arXiv version to canonical work identity, retaining version metadata.
2. DOI normalization (`https://doi.org/...` stripped, case normalized appropriately).
3. GitHub provider repository ID; repo rename must not create a new entity.
4. Canonical URL with tracking params removed, redirects resolved safely.
5. Title similarity/embeddings only propose merge; never auto-merge weak identity without high confidence and provenance.
6. Record aliases and all source links.

## AI enrichment stages
1. CV relevance classification (rules + optional model).
2. Taxonomy classification using **existing node IDs only**.
3. Vietnamese summary with source-grounded claims, no invented benchmarks.
4. Extract model/dataset/repository mentions as candidates.
5. Resolve entities against known IDs, attach evidence and confidence.
6. Quality checks: JSON schema, hallucination indicators, length, toxicity, attribution, duplicates.
7. Review uncertain summaries or relations. Store prompt/model/input/output versions.

## Structured output contract
```json
{
  "schema_version": "1.0",
  "relevance": {"is_cv": true, "confidence": 0.95},
  "taxonomy_assignments": [{"node_id": "<existing-uuid>", "confidence": 0.9}],
  "summary_vi": {"problem": "...", "approach": "...", "contribution": "...", "limitations": "..."},
  "evidence": [{"claim_path": "summary_vi.contribution", "source_url": "https://example.org", "source_excerpt": "..."}],
  "relations": [],
  "requires_review": true
}
```
Example only; do not send placeholder UUIDs to database.

## Publish policy
- Trusted metadata: may auto-publish after deterministic validation and provenance checks.
- AI summaries: publish only when source-grounded and confidence/quality gate passes; label `AI-generated summary` and offer correction.
- Community submissions: moderator approval required.
- Ambiguous identity, unverified job/event, suspicious source or rights issue: human review.

## Failure modes and tests
429 retry with Retry-After; 5xx exponential backoff with jitter; 4xx permanent except rate limits; provider outage leaves previous content available. Dead-letter jobs visible in admin. Test pagination, partial failures, duplicate replay, rate limit, malformed JSON, missing DOI, repo rename, unsafe URLs, prompt injection, checkpoint restart, source takedown.

## Data governance
Do not mirror full paywalled/copyrighted content; prefer metadata and excerpts where permitted. Persist attribution, original URL, retrieval time, usage restrictions and takedown status. Do not treat source text as system instructions.
