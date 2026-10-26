import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
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
      className="flex-1 border-b border-border"
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
                  "inline-flex min-h-11 items-center gap-2 border-b-2 px-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-base",
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

/** The hashtag the feed is filtered by, if any, with a link that clears it. */
export function ActiveTag({
  state,
  filters,
}: {
  state: NewsViewState;
  filters: NewsFilters;
}) {
  const t = useTranslations("News.filters");
  if (!filters.tag) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      {t("filteringBy")}
      <Link
        href={{
          pathname: "/news",
          query: newsQuery(state, { ...filters, tag: null }),
        }}
        scroll={false}
        aria-label={t("clearTag", { tag: `#${filters.tag}` })}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent bg-accent px-3 font-mono text-xs text-accent-foreground"
      >
        #{filters.tag}
        <X aria-hidden className="size-3" />
      </Link>
    </p>
  );
}
