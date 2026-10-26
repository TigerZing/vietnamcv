# ADR-011: News feed order, region tabs and technology hashtags

- Status: Accepted
- Date: 2026-10-25

## Context

The owner asked for a News page that a technical computer vision audience can scan:
Vietnam and international news clearly apart, the newest news first with its time
visible, technology hashtags, and leaner cards. The feed was ordered by
`contents.published_at`, the moment VietnamCV published a post. A curated import
publishes a whole batch at once, so that order followed the file, not the news.
`news_items.keywords` are Vietnamese phrases for readers, not a filterable vocabulary.

## Decision

- **Order.** `news_items.dated_at` holds when the news happened (the source's date,
  midnight UTC) and the feed is ordered by `(dated_at, content_id)` descending, with the
  keyset cursor on the same pair. The import sets it on every run. Migration 0005
  backfills it from the earliest provenance record, else `published_at`.
  `published_at` keeps its meaning (first publication on VietnamCV).
- **Regions.** The existing `region` filter (`vietnam`, `international`) becomes tabs:
  All, Trong nước / Vietnam, Quốc tế / International.
- **Hashtags.** `news_items.tags` is a short list (max 8) of language-neutral technology
  terms (for example `VLM`, `AnomalyDetection`, `EdgeAI`), matching
  `^[A-Za-z0-9][A-Za-z0-9+.-]{0,39}$` and shown as `#tag`. `GET /api/v1/news?tag=`
  filters with a GIN index; `GET /api/v1/news/tags?region=` returns tags by use. Keywords
  stay as they are.
- **Time.** Cards show the source date relative for the last week ("Hôm qua", "3 ngày
  trước") by the calendar in Vietnam, and the date after that; the last two days are
  highlighted. Month-only dates stay months.
- Filters live in the URL (`region`, `tag`, plus the layout), as plain links.

## Consequences

- Same-day stories have no defined order among themselves beyond the id.
- Tags are curated in the seed file for now. When taxonomy (S1) lands, tags should map to
  taxonomy nodes instead of free strings.
- `/api/v1/news/tags` is declared before `/api/v1/news/{slug}`, so no post can have the
  slug `tags`.

## Amendment (2026-10-26)

At the owner's request the News page drops its visible title, intro text and the hashtag
bar; the region tabs lead the page and the list/card toggle is icon-only. Hashtags stay on
posts and still filter the feed; an active hashtag shows once with a link that clears it.
`GET /api/v1/news/tags` stays in the API, unused by the web app for now.

News no longer carries research papers (they belong in Papers) or competitions and
conference deadlines: the curated import rejects the `research` and `events` categories,
and a curated file can list `withdrawn` posts, which the import archives (audited, kept in
the database, gone from the site).
