import { defineRouting } from "next-intl/routing";

// ADR-008: Vietnamese is the default; every route carries an explicit locale prefix so
// each language has its own canonical, indexable URL. Browser language detection is off:
// the platform is Vietnamese-first, and "/" always lands on /vi so links and crawlers see
// one predictable entry point. Visitors switch language explicitly.
export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "always",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
