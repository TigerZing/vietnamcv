# ADR-016: Discover picks from the owner's Google Sheet

- Status: Accepted
- Date: 2026-10-28

## Context

The owner wants the "Khám phá" (Discover) tab to show interesting computer vision
material that is not news: articles, courses, books, interactive tools, code, datasets
and demos. They want to paste links into a Google Sheet and have the site pick them up,
the same way approved news rows reach the News page. The news flow writes seed JSON for
the API because posts carry full text, images and comments. A Discover pick is only a
link with a short introduction, so it needs none of that.

## Decision

- **Sheet.** `Khám phá CV` in the Drive folder `07_Khám phá (Discover)`, tab `Khám phá`,
  columns `Duyệt` (checkbox, ticked by default on every row), `Link`, `Loại` (dropdown),
  `Ghi chú của bạn`, `Ngày thêm`, then two grey columns the sync fills in:
  `Tiêu đề trên web` and `Trạng thái`. Only `Link` is required. A `Hướng dẫn` tab explains
  the columns in Vietnamese.
- **Data.** A sync (Claude, with the `vietnamcv-sync-discover` skill) opens each approved
  link and writes `apps/web/src/content/discover.json`: a slug, the link, the kind, the
  day added, the publisher, a title and a two to three sentence summary in Vietnamese and
  English, and up to six technology tags. The link is the row's identity. Unticking a
  published row removes it from the file on the next sync. The file is validated with
  zod when the module loads, so a bad sync fails the build and the unit tests.
- **Page.** `/discover` is static and lists the picks as cards, newest first, with a
  filter by kind when more than one kind is present. Each card links to the source in a
  new tab. No images: picks link out, and previews of other sites' images would raise
  the rights questions of ADR-010 for little gain.

## Consequences

- Adding a pick is a pull request that changes one JSON file; after merging, the owner
  runs `scripts/run.sh update` to rebuild the web app.
- No API table, so no comments, admin deletion or search on picks yet. Moving the data
  into the API is a follow-up when any of those is needed.
- Titles and summaries are editor-written with AI assistance from the linked page.
