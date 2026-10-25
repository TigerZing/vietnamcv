import { Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import type { NewsSummary } from "@/lib/news";
import { mediaSrc } from "@/lib/media";
import { cn } from "@/lib/utils";
import { youtubeThumbnail } from "@/lib/youtube";

import { CategoryArt } from "./category";

/** The picture of a post: its stored image, else the video thumbnail, else category art. */
export function NewsThumb({
  item,
  sizes,
  className,
  showVideoBadge = true,
}: {
  item: NewsSummary;
  sizes: string;
  className?: string;
  showVideoBadge?: boolean;
}) {
  const t = useTranslations("News");
  const src = item.image
    ? mediaSrc(item.image.id)
    : item.video
      ? youtubeThumbnail(item.video.id)
      : null;

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden bg-surface-muted",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
      ) : (
        <CategoryArt category={item.category} className="size-full" />
      )}
      {item.video && showVideoBadge ? (
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white">
          <Play aria-hidden className="size-3.5 fill-current" />
          {t("hasVideo")}
        </span>
      ) : null}
    </div>
  );
}
