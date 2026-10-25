import { Link } from "@/i18n/navigation";
import type { NewsSummary } from "@/lib/news";

import { NewsKicker, NewsMeta } from "./news-meta";
import { NewsTags } from "./news-tags";
import { NewsThumb } from "./news-thumb";

/** A post as one compact row of the list view: small picture left, text right. */
export function NewsListItem({
  item,
  now,
}: {
  item: NewsSummary;
  now: number;
}) {
  return (
    <article className="group relative flex gap-3 rounded-lg border border-border bg-surface p-3 transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-accent/50 sm:gap-4">
      <NewsThumb
        item={item}
        sizes="(min-width: 640px) 176px, 96px"
        showVideoBadge={false}
        className="w-24 shrink-0 self-start rounded-md sm:w-44"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <NewsKicker item={item} now={now} />
        <h2 className="line-clamp-2 text-base leading-snug font-semibold text-balance">
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
        <NewsTags tags={item.tags} max={4} className="mt-0.5" />
        <div className="mt-auto pt-1">
          <NewsMeta item={item} />
        </div>
      </div>
    </article>
  );
}
