# ADR-013: Demo watch page, descriptions and comments

- Status: Accepted
- Date: 2026-10-27
- Supersedes: the "Data" and "Playback" points of [ADR-012](012-demo-products-page.md)

## Context

The owner asked to turn the demo grid into a watch page: the demo list in a left column,
the chosen video playing on the right, and below it a description taken from the post,
who made it, the source and a place to comment. ADR-012 kept demos out of the database
"until demos need submissions or moderation". Comments need moderation, so that time has
come.

## Decision

- **Layout.** `/demos` is a two-column page from 1024px (`lg`): a sticky, scrollable list
  on the left and the player, details and comments on the right. Below 1024px the player
  comes first and the list follows. The list lives in `demos/layout.tsx`, so choosing a
  demo swaps only the right column (client navigation, no full page load).
- **URLs and playback.** Each demo has its own statically generated page,
  `/demos/<id>`, so it can be linked and shared. Choosing a demo from the list opens that
  page and loads LinkedIn's player at once. `/demos` shows the first demo with its
  thumbnail and loads the player only when pressed, so landing on the tab sends nothing
  to LinkedIn. Next keeps recently left pages mounted but hidden; the player blanks its
  frame while hidden so a video never keeps playing out of sight.
- **Descriptions and credits.** `demos.ts` gains `description` (vi/en, a few sentences
  written by the editor from the post, marked as such on the page) and `maker` (who
  built it, when the post credits someone other than the poster). Both stay in the web
  app; they are editorial text, not user content.
- **Comments.** A demo is a `contents` row of type `demo` (migration 0006 widens the
  type check). `services/api/seed/demos.json` lists one entry per demo (slug
  `demo-<id>`, URN, link, Vietnamese title) and `app.cli.seed_demos`, run by the seed
  service after the news import, publishes them with LinkedIn as provenance and archives
  demos removed from the list. Comments reuse the news comment rules, rate limits and
  moderation queue through `GET/POST /api/v1/demos/{slug}/comments`. A unit test keeps
  the seed and `demos.ts` in step.

## Consequences

- Adding a demo now touches two files: an entry in `demos.ts` (with thumbnail) and one in
  `services/api/seed/demos.json`; the unit test fails if they drift.
- Demo comments show in the same moderation queue as news comments.
- `/demos/<id>` for an unknown id renders the not-found state.
- Descriptions are summaries, not quotes; the full post stays one click away.
