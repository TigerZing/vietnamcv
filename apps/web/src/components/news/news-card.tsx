import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { NewsSummary } from "@/lib/news";

import { CategoryBadge } from "./category";
import { NewsMeta } from "./news-meta";
import { NewsThumb } from "./news-thumb";

export function NewsCard({
  item,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  item: NewsSummary;
  sizes?: string;
}) {
  const t = useTranslations("News");

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      <NewsThumb item={item} sizes={sizes} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CategoryBadge category={item.category} />
          <span>{t(`regions.${item.region}`)}</span>
        </div>
        <h2 className="text-lg leading-snug font-semibold text-balance">
          <Link
            href={`/news/${item.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {item.title}
          </Link>
        </h2>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {item.summary}
        </p>
        <div className="mt-auto border-t border-border pt-3">
          <NewsMeta item={item} />
        </div>
      </div>
    </article>
  );
}
