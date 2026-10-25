import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { NewsSummary } from "@/lib/news";

import { CategoryBadge } from "./category";
import { NewsMeta } from "./news-meta";
import { NewsThumb } from "./news-thumb";

/** A post as one row of the list view: picture on the left, text on the right. */
export function NewsListItem({ item }: { item: NewsSummary }) {
  const t = useTranslations("News");

  return (
    <article className="group relative flex gap-4 rounded-xl border border-border bg-surface p-3 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md sm:gap-5 sm:p-4">
      <NewsThumb
        item={item}
        sizes="(min-width: 640px) 240px, 112px"
        showVideoBadge={false}
        className="w-28 shrink-0 self-start rounded-lg sm:w-60"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CategoryBadge category={item.category} />
          <span>{t(`regions.${item.region}`)}</span>
          {item.video ? (
            <span className="inline-flex items-center gap-1">
              <Play aria-hidden className="size-3 fill-current" />
              {t("hasVideo")}
            </span>
          ) : null}
        </div>
        <h2 className="text-base leading-snug font-semibold text-balance sm:text-lg">
          <Link
            href={`/news/${item.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {item.title}
          </Link>
        </h2>
        <p className="line-clamp-2 hidden text-sm text-muted-foreground sm:block">
          {item.summary}
        </p>
        <div className="mt-auto">
          <NewsMeta item={item} />
        </div>
      </div>
    </article>
  );
}
