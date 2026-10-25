import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import type { NewsSummary } from "@/lib/news";

import { SourceDate } from "./source-date";

export function NewsMeta({ item }: { item: NewsSummary }) {
  const t = useTranslations("News");
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
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
  );
}
