# Implementation status

Updated after every task. A task is Done only with passing tests or demonstrated
behaviour. Plan: [Sprint 0–1 plan](https://claude.ai/artifact/5RodXoxVBbfzRcCkfs5WVi).

## Sprint 0: Foundation

| Task ID | Status | PR/Commit | Tests | Risks | Next action |
| --- | --- | --- | --- | --- | --- |
| S0-01 (FND-01) Repository scaffold | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `make bootstrap`, `make help` | None | — |
| S0-02 (FND-04) Config and env validation | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `tests/unit/test_config.py`, `apps/web/tests/unit/env.test.ts` | None | — |
| S0-03 API skeleton | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `test_errors.py`, `test_health.py` (unit + integration) | None | — |
| S0-04 (FND-05) Database baseline | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `test_migrations.py` (round trip, drift, unaccent), `test_outbox.py` | Extensions need CREATE privilege on managed hosts | Confirm with host (ADR-007) |
| S0-05 Worker skeleton | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `test_worker.py`, `test_idempotency.py`; beat + worker verified in Compose | None | — |
| S0-06 Auth seam and RBAC | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `test_security.py`, deployed-env refusal in `test_config.py` | Real OIDC pending ADR-002 | Choose provider by Sprint 3 |
| S0-07 (FND-06) Web shell and design tokens | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | Vitest (states, messages, env); Playwright at 360px + 1280px incl. axe, keyboard, overflow, 404 | Vietnamese copy needs native review | Review `messages/vi.json` |
| S0-08 Typed API client | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | `make openapi-check` in CI | None | — |
| S0-09 (FND-02) Docker Compose | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | All 6 services healthy via `docker compose up --wait`; readiness 200; beat → worker outbox relay observed | None | — |
| S0-10 (FND-03) CI pipeline | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | First run on PR #1: all 5 jobs green (API, web incl. e2e, contract drift, Docker, security) | Branch protection not yet enabled | Enable branch protection on `main` requiring these checks |
| S0-11 (FND-05) ADRs and status | Done | [#1](https://github.com/TigerZing/vietnamcv/pull/1) | — | ADR-002 and ADR-007 still Proposed | Decisions by Sprint 3 / end of Sprint 1 |

## Sprint 1: Canonical content and taxonomy

Started with the slice the owner asked for: curated news posts with comments. It lands
part of the Sprint 1 content model early; taxonomy, papers and repositories are not
started. See the plan for tasks S1-01 … S1-10.

| Task ID | Status | PR/Commit | Tests | Risks | Next action |
| --- | --- | --- | --- | --- | --- |
| NEWS-01 Content core subset (sources, contents, content_sources, news_items, audit_events) and `PublishService` | Done | [#10](https://github.com/TigerZing/vietnamcv/pull/10) | `test_news.py`, migration round trip and drift | `news_items.category` is a fixed list until taxonomy (S1) replaces it | Map categories to taxonomy nodes in S1 |
| NEWS-02 Curated news import (14 approved sheet rows, 5 with video) | Done | [#10](https://github.com/TigerZing/vietnamcv/pull/10) | `test_committed_seed_files_import`, idempotency test | Videos were chosen from search results by title; editor should confirm each | Editor review of `seed/news/2026-10-25.json` |
| NEWS-03 News list and post pages (video, provenance, editor note) | Done | [#10](https://github.com/TigerZing/vietnamcv/pull/10) | `news.spec.ts` at 360px + desktop with axe | Pages render at request time (not cached) | Cache with tag revalidation via the outbox handler |
| COMM-01 Comments (anonymous, guest name, Google), rate limits, moderation API | Done | [#10](https://github.com/TigerZing/vietnamcv/pull/10) | `test_comments.py`, `test_comment_policy.py`, e2e comment flow | No moderation UI or reporting yet | Moderation UI with the admin area (Sprint 3) |
| NEWS-04 Post text in Vietnamese and English, stored images, related links (ADR-010) | Done | [#11](https://github.com/TigerZing/vietnamcv/pull/11) | `test_news_media.py`, `test_media.py`, `article-body.test.ts`, `news.spec.ts` | 11 source images are `permission_pending` and hidden when deployed; texts are AI-assisted | Owner asks sources for image permission; editor reviews the 14 texts |
| NEWS-05 News list layouts: list (default) and cards with 2-4 columns, 15 per page | Done | [#11](https://github.com/TigerZing/vietnamcv/pull/11) | `news-view.test.ts`, `news.spec.ts` at 360px + desktop with axe | Layout choice lives in the URL only | Remember the choice per visitor if wanted |
| NEWS-06 Images from inside the source article (figures placed in the text, English captions, AVIF input) | Review | this branch | `test_news_media.py`, `test_media.py`, `article-body.test.ts`, `news.spec.ts` | 15 figures in 4 posts are `permission_pending` and hidden when deployed; RSIP magazine photos exist only as full pages and were not taken | Owner asks sources for image permission |
| NEWS-07 News page for a technical audience: Vietnam / international tabs, newest news first by source date, technology hashtags with filter, leaner cards (ADR-011) | Done | [#18](https://github.com/TigerZing/vietnamcv/pull/18) | `test_news.py`, `news-time.test.ts`, `news-view.test.ts`, `news.spec.ts` at 360px + desktop with axe | Hashtags are curated free strings | Map hashtags to taxonomy nodes in S1 |
| NEWS-08 Simpler News page (no title, intro or hashtag bar; icon-only layout toggle); no papers, competitions or deadlines in News, withdrawn posts archived | Review | this branch | `test_news.py`, `news.spec.ts` at 360px + desktop with axe | 3 posts withdrawn (ECCV best paper, FEEL, conference deadlines) | Owner reviews whether the Âu Lạc Grand Prize posts count as competition news |
| AUTH-G Google sign-in (ADR-009) | Done | [#10](https://github.com/TigerZing/vietnamcv/pull/10) | `test_google_auth.py`, `auth-tokens.test.ts` | Needs an OAuth client from the owner; session lasts one hour | Owner creates the Google OAuth client |

## Open decisions

- Auth provider (ADR-002), by Sprint 3. Google is in use for comments (ADR-009); a
  managed provider can still replace it.
- Hosting and region (ADR-007), staging by end of Sprint 1.
- LLM provider and monthly budget, by Sprint 3.
- Native-speaker review of Vietnamese UI copy and taxonomy labels.
