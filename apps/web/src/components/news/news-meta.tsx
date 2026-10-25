import { MessageCircle, Play } from "lucide-react";
import { useTranslations } from "next-intl";

import type { NewsSummary } from "@/lib/news";

import { NewsTime } from "./news-time";
import { RegionLabel } from "./region-label";

/** Top line of a post card: region, when it happened, and a video mark. */
export function NewsKicker({ item, now }: { item: NewsSummary; now: number }) {
  const t = useTranslations("News");
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <RegionLabel region={item.region} />
      <span aria-hidden>·</span>
      <NewsTime source={item.source} now={now} />
      {item.video ? (
        <>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Play aria-hidden className="size-3 fill-current" />
            {t("hasVideo")}
          </span>
        </>
      ) : null}
    </div>
  );
}

/** Bottom line of a post card: source, category and comment count. */
export function NewsMeta({ item }: { item: NewsSummary }) {
  const t = useTranslations("News");
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
      <span className="truncate">
        {item.source.name}
        <span aria-hidden> · </span>
        {t(`categories.${item.category}`)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1">
        <MessageCircle aria-hidden className="size-3.5" />
        <span className="sr-only">
          {t("comments", { count: item.comment_count })}
        </span>
        <span aria-hidden>{item.comment_count}</span>
      </span>
    </div>
  );
}
