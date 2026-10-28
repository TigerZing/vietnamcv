// Shared by server and client components (no server-only imports).

import { z } from "zod";

import data from "@/content/discover.json";
import type { Locale } from "@/i18n/routing";

/**
 * Picks for /discover: articles, courses, tools and other things worth a look that are
 * not news. The owner pastes links into the "Khám phá CV" Google Sheet; a sync writes
 * the approved rows to `src/content/discover.json` with editor-written titles and
 * summaries in both languages (ADR-016). Each entry links out to its source.
 */
export const DISCOVER_KINDS = [
  "article",
  "video",
  "course",
  "book",
  "interactive",
  "code",
  "dataset",
  "demo",
  "other",
] as const;

export type DiscoverKind = (typeof DISCOVER_KINDS)[number];

const localized = z.object({
  vi: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

const discoverItem = z.object({
  /** Stable slug; never change it once published. */
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  /** The link from the sheet, which is the row's identity there. */
  url: z.url({ protocol: /^https$/ }),
  kind: z.enum(DISCOVER_KINDS),
  /** Day the owner added the link, `YYYY-MM-DD`; newest first on the page. */
  addedOn: z.iso.date(),
  /** Who published it: a site, lab, company or author. */
  source: z.string().trim().min(1),
  title: localized,
  summary: localized,
  tags: z
    .array(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9+.-]{0,39}$/))
    .max(6)
    .default([]),
});

const discoverFile = z.object({
  description: z.string(),
  items: z.array(discoverItem),
});

export type DiscoverItem = z.infer<typeof discoverItem>;

/** Parses the synced file; throws at build time when the sync wrote something invalid. */
export function parseDiscover(input: unknown): DiscoverItem[] {
  const { items } = discoverFile.parse(input);
  // Stable sort: same-day picks keep the sheet's order.
  return [...items].sort((a, b) => b.addedOn.localeCompare(a.addedOn));
}

export const DISCOVER_ITEMS: readonly DiscoverItem[] = parseDiscover(data);

/** Kinds that have at least one pick, in menu order. */
export function presentKinds(
  items: readonly DiscoverItem[],
): readonly DiscoverKind[] {
  const present = new Set(items.map((item) => item.kind));
  return DISCOVER_KINDS.filter((kind) => present.has(kind));
}

/** Host shown under each pick, without `www.`. */
export function discoverHost(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function localizedPick(item: DiscoverItem, locale: Locale) {
  return { title: item.title[locale], summary: item.summary[locale] };
}
