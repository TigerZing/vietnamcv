# ADR-008: Internationalization (Vietnamese / English)

- Status: Accepted (implemented in Sprint 0)
- Date: 2026-10-25

## Context

The project promises a bilingual platform; specs say "Vietnamese-first" and "preserve
original English paper titles and abstracts" but define no i18n model.

## Decision

- **UI is fully bilingual.** Routes are prefixed `/vi/…` and `/en/…`; `/` always
  redirects to `/vi` (browser language detection is off, so links and crawlers get one
  predictable entry point). Each page declares `hreflang` alternates.
- Messages live in `apps/web/messages/{vi,en}.json`, typed against the Vietnamese file;
  a unit test enforces identical keys and no empty strings.
- **Content stays in its original language.** Papers keep English titles and abstracts.
  Vietnamese summaries (`content_summaries`, ADR-003) are added where available. Community
  content is not machine-translated in MVP.
- Taxonomy nodes carry both `label_vi` and `label_en`, with aliases in both languages.
- Implementation uses next-intl with the locale read from `next/root-params`, so pages
  remain statically prerendered under Cache Components.
- Timestamps are stored in UTC and displayed in `Asia/Ho_Chi_Minh` by default.

## Consequences

- English visitors see English navigation and original-language content plus Vietnamese
  summaries; full English summaries can be added later per content item.
