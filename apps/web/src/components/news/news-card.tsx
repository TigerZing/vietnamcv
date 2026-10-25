import { MessageCircle, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { NewsSummary } from "@/lib/news";
import { youtubeThumbnail } from "@/lib/youtube";

import { CategoryArt, CategoryBadge } from "./category";
import { SourceDate } from "./source-date";

export function NewsCard({ item }: { item: NewsSummary }) {
  const t = useTranslations("News");

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-surface-muted">
        {item.video ? (
          <>
            <Image
              src={youtubeThumbnail(item.video.id)}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            />
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white">
              <Play aria-hidden className="size-3.5 fill-current" />
              {t("hasVideo")}
            </span>
          </>
        ) : (
          <CategoryArt category={item.category} className="size-full" />
        )}
      </div>
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
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="truncate">
            {item.source.name}
            {item.source.published_on ? (
              <>
                {" · "}
                <SourceDate
                  value={item.source.published_on}
                  precision={item.source.published_precision}
                />
              </>
            ) : null}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <MessageCircle aria-hidden className="size-3.5" />
            <span className="sr-only">
              {t("comments", { count: item.comment_count })}
            </span>
            <span aria-hidden>{item.comment_count}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
