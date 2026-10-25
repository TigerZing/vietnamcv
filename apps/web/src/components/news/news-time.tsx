import { useFormatter, useTranslations } from "next-intl";

import type { NewsSummary } from "@/lib/news";
import { isFresh, newsAge } from "@/lib/news-time";
import { cn } from "@/lib/utils";

/** When the story happened, relative for the last week ("Hôm qua"), else the date. */
export function NewsTime({
  source,
  now,
  className,
}: {
  source: NewsSummary["source"];
  now: number;
  className?: string;
}) {
  const t = useTranslations("News.time");
  const format = useFormatter();
  const { published_on: value, published_precision: precision } = source;
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  // Dates are calendar days without a time; format them in UTC so they never shift.
  const full = format.dateTime(
    date,
    precision === "month"
      ? { month: "long", year: "numeric", timeZone: "UTC" }
      : { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );
  const age = newsAge(value, precision, now);
  const label =
    age.kind === "today"
      ? t("today")
      : age.kind === "yesterday"
        ? t("yesterday")
        : age.kind === "days"
          ? t("daysAgo", { count: age.count })
          : precision === "month"
            ? full
            : format.dateTime(date, {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              });
  const fresh = isFresh(age);
  return (
    <time
      dateTime={precision === "month" ? value.slice(0, 7) : value}
      title={full}
      className={cn(
        "inline-flex items-center gap-1.5 tabular-nums",
        fresh && "font-medium text-foreground",
        className,
      )}
    >
      {fresh ? (
        <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      ) : null}
      {label}
    </time>
  );
}
