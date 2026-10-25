import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { TagCount } from "@/lib/news";
import {
  NEWS_REGIONS,
  newsQuery,
  type NewsFilters,
  type NewsViewState,
} from "@/lib/news-view";
import { cn } from "@/lib/utils";

/** Tabs for all / Vietnam / international news; plain links, so they work without JS. */
export function RegionTabs({
  state,
  filters,
}: {
  state: NewsViewState;
  filters: NewsFilters;
}) {
  const t = useTranslations("News");
  const tabs = [
    { region: null, label: t("filters.all") },
    ...NEWS_REGIONS.map((region) => ({
      region,
      label: t(`regions.${region}`),
    })),
  ];
  return (
    <nav
      aria-label={t("filters.regionsLabel")}
      className="border-b border-border"
    >
      <ul className="-mb-px flex gap-1">
        {tabs.map(({ region, label }) => {
          const active = filters.region === region;
          return (
            <li key={region ?? "all"}>
              <Link
                href={{
                  pathname: "/news",
                  query: newsQuery(state, { ...filters, region }),
                }}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors sm:px-4 sm:text-base",
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {region ? (
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      region === "vietnam" ? "bg-danger" : "bg-accent",
                    )}
                  />
                ) : null}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The most used technology hashtags; choosing one filters the feed, again clears it. */
export function TagBar({
  tags,
  state,
  filters,
}: {
  tags: TagCount[];
  state: NewsViewState;
  filters: NewsFilters;
}) {
  const t = useTranslations("News.filters");
  // The active tag stays visible even when the chosen region has no post with it.
  const shown =
    filters.tag && !tags.some(({ tag }) => tag === filters.tag)
      ? [{ tag: filters.tag, count: 0 }, ...tags]
      : tags;
  if (shown.length === 0) return null;
  return (
    <nav aria-label={t("tagsLabel")} className="flex min-w-0 items-start gap-3">
      <span className="mt-1.5 shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t("tagsLabel")}
      </span>
      <ul className="flex min-w-0 flex-wrap gap-1.5">
        {shown.map(({ tag, count }) => {
          const active = filters.tag === tag;
          return (
            <li key={tag}>
              <Link
                href={{
                  pathname: "/news",
                  query: newsQuery(state, {
                    ...filters,
                    tag: active ? null : tag,
                  }),
                }}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-xs transition-colors",
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface text-foreground hover:border-accent/60",
                )}
              >
                #{tag}
                {active ? (
                  <X aria-hidden className="size-3" />
                ) : count > 0 ? (
                  <span className="text-muted-foreground">
                    <span className="sr-only">, </span>
                    {t("tagCount", { count })}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
