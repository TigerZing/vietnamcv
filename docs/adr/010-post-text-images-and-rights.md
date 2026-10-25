# ADR-010: Post text, stored images and image rights

- Status: Accepted
- Date: 2026-10-25

## Context

The owner asked that every news post have real article text (not only a title), an
illustration image, the source link at the end, a Vietnamese and an English version that
follow the language the reader picks, and that the text, images and links be stored by
VietnamCV. `specs/05-INGESTION.md` forbids mirroring full copyrighted articles, and
ADR-005 sends rights issues to human review. The owner chose to use each source's own lead
image, with credit, and to seek permission before public launch.

## Decision

**Text.** `content_translations` holds VietnamCV's own title, summary and body per
language (`vi`, `en`; Vietnamese required). `contents.title` stays the title as the
source published it and is returned as `original_title`. The API takes `lang` and falls
back to Vietnamese when a translation is missing; the response says which language it
returned. Bodies are plain text (paragraphs, `## ` headings, `- ` items) rendered without
HTML. Text written with AI assistance sets `news_items.ai_assisted`, and the page labels
it (ADR-005). Bodies are written from the source, never copied from it.

**Images.** `media_assets` stores image bytes in PostgreSQL. The import downloads each
curated image once (HTTPS only, 10 MB cap, content type checked, article page sent as
Referer), verifies it with Pillow, re-encodes it to WebP (max 1600 px, metadata removed)
and deduplicates by SHA-256. `content_media` links an image to a content with alt text,
caption, credit, credit URL and `rights`. A failed download leaves the post without a new
image and is retried on the next import. Bytes are served at `GET /api/v1/media/{id}`
(immutable cache, `nosniff`, `default-src 'none'`) and proxied by the web app at
`/api/media/{id}`. Only images used by published content are served.

**Rights.** `rights` is `own` (made by VietnamCV), `licensed` (permission or licence) or
`permission_pending` (the source's image, credited, permission not yet given). In
staging and production, `permission_pending` images are hidden from the API and the media
endpoint, so a deploy cannot show them by accident. Locally they show, so the owner can
review the layout. Sources without a usable image get a VietnamCV illustration (`own`).

**Links.** `content_links` stores related links (official page, paper, code, dataset,
model) shown with the source at the end of the post.

## Consequences

- Before launch, each `permission_pending` image needs the source's permission (then set
  `rights` to `licensed` in the seed file) or a replacement.
- Image bytes in PostgreSQL are fine at this scale and are covered by database backups;
  move them to object storage (ADR-007) when volume grows. Only `media/service.py`
  changes.
- The curated import needs outbound HTTPS to the image hosts.
- Keywords, captions and alt text are stored in Vietnamese only for now.
