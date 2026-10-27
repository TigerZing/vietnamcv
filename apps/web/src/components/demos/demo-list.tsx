"use client";

import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useSelectedLayoutSegment } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { type Demo, demoThumbnail, formatDuration } from "@/lib/demos";
import { cn } from "@/lib/utils";

/**
 * The left column: every demo as a small thumbnail row. Choosing one swaps the player
 * on the right without reloading the page; `/demos` itself shows the first demo.
 */
export function DemoList({ demos }: { demos: readonly Demo[] }) {
  const t = useTranslations("Demos");
  const locale = useLocale() as Locale;
  const selected = useSelectedLayoutSegment() ?? demos[0]?.id;

  return (
    <nav aria-label={t("listLabel")}>
      <ol className="flex flex-col gap-1">
        {demos.map((demo) => {
          const active = demo.id === selected;
          const title = demo.title[locale];
          return (
            <li key={demo.id}>
              <Link
                href={`/demos/${demo.id}`}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active && "bg-surface-muted",
                )}
              >
                <span className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-md bg-black sm:w-40">
                  <Image
                    src={demoThumbnail(demo)}
                    alt=""
                    fill
                    unoptimized
                    sizes="10rem"
                    className="object-cover"
                  />
                  <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 py-px text-[11px] font-medium text-white tabular-nums">
                    {demo.kind === "video" && demo.duration ? (
                      formatDuration(demo.duration)
                    ) : (
                      <span className="inline-flex items-center gap-0.5">
                        <ImageIcon aria-hidden className="size-3" />
                        {t("imageBadge")}
                      </span>
                    )}
                  </span>
                  {active ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-red-600" />
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                  {active ? (
                    <span className="text-xs font-medium text-accent">
                      {t("nowPlaying")}
                    </span>
                  ) : null}
                  <span className="line-clamp-2 text-sm leading-snug font-medium">
                    {title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {demo.maker ?? demo.author}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
