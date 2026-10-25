import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Technology hashtags of a post; each links to the feed filtered by that tag. Raised
 * above the card's full-size title link so both stay clickable.
 */
export function NewsTags({
  tags,
  max = tags.length,
  className,
}: {
  tags: string[];
  max?: number;
  className?: string;
}) {
  const t = useTranslations("News");
  if (tags.length === 0) return null;
  return (
    <ul
      aria-label={t("tags")}
      className={cn("relative z-10 flex flex-wrap gap-1.5", className)}
    >
      {tags.slice(0, max).map((tag) => (
        <li key={tag}>
          <Link
            href={{ pathname: "/news", query: { tag } }}
            className="inline-flex min-h-6 items-center rounded-md bg-surface-muted px-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
