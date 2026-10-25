import { Link } from "@/i18n/navigation";
import type { NewsSummary } from "@/lib/news";

import { NewsKicker, NewsMeta } from "./news-meta";
import { NewsTags } from "./news-tags";
import { NewsThumb } from "./news-thumb";

export function NewsCard({
  item,
  now,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  item: NewsSummary;
  now: number;
  sizes?: string;
}) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-accent/50">
      <NewsThumb item={item} sizes={sizes} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <NewsKicker item={item} now={now} />
        <h2 className="line-clamp-3 text-base leading-snug font-semibold text-balance">
          <Link
            href={`/news/${item.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {item.title}
          </Link>
        </h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {item.summary}
        </p>
        <NewsTags tags={item.tags} max={3} />
        <div className="mt-auto pt-2">
          <NewsMeta item={item} />
        </div>
      </div>
    </article>
  );
}
