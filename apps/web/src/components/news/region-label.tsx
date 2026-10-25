import { useTranslations } from "next-intl";

import type { NewsSummary } from "@/lib/news";
import { cn } from "@/lib/utils";

/** "Trong nước" or "Quốc tế", with a coloured dot so the two read apart at a glance. */
export function RegionLabel({
  region,
  className,
}: {
  region: NewsSummary["region"];
  className?: string;
}) {
  const t = useTranslations("News.regions");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          region === "vietnam" ? "bg-danger" : "bg-accent",
        )}
      />
      {t(region)}
    </span>
  );
}
