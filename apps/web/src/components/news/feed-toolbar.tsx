import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import {
  GRID_COLUMNS,
  newsQuery,
  type NewsFilters,
  type NewsViewState,
} from "@/lib/news-view";
import { cn } from "@/lib/utils";

function Option({
  state,
  filters,
  active,
  label,
  children,
}: {
  state: NewsViewState;
  filters: NewsFilters;
  active: boolean;
  label?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={{ pathname: "/news", query: newsQuery(state, filters) }}
      aria-current={active ? "true" : undefined}
      aria-label={label}
      title={label}
      scroll={false}
      className={cn(
        "inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/** Switches between the list and card layouts; plain links, so it works without JS. */
export function FeedToolbar({
  state,
  filters,
}: {
  state: NewsViewState;
  filters: NewsFilters;
}) {
  const t = useTranslations("News.view");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label={t("label")}>
        <div className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1">
          <Option
            state={{ ...state, view: "list" }}
            filters={filters}
            label={t("list")}
            active={state.view === "list"}
          >
            <List aria-hidden className="size-4" />
          </Option>
          <Option
            state={{ ...state, view: "grid" }}
            filters={filters}
            label={t("grid")}
            active={state.view === "grid"}
          >
            <LayoutGrid aria-hidden className="size-4" />
          </Option>
        </div>
      </nav>
      {state.view === "grid" ? (
        <nav
          aria-label={t("columns")}
          className="hidden items-center gap-2 lg:flex"
        >
          <span aria-hidden className="text-sm text-muted-foreground">
            {t("columns")}
          </span>
          <div className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1">
            {GRID_COLUMNS.map((cols) => (
              <Option
                key={cols}
                state={{ view: "grid", cols }}
                filters={filters}
                active={state.cols === cols}
                label={t("columnsOption", { count: cols })}
              >
                {cols}
              </Option>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
