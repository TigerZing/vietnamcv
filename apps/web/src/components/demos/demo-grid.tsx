"use client";

import { ExternalLink, Image as ImageIcon, Play, X } from "lucide-react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/routing";
import {
  type Demo,
  demoEmbedUrl,
  demoPostUrl,
  demoPublishedAt,
  demoThumbnail,
  formatDuration,
} from "@/lib/demos";

/**
 * A YouTube-style grid: pressing a thumbnail swaps it for the player in the same card, so
 * the page never changes. Only one demo plays at a time; nothing loads from LinkedIn
 * until a viewer presses play.
 */
export function DemoGrid({ demos }: { demos: readonly Demo[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    if (playing === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlaying(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {demos.map((demo) => (
        <li key={demo.id} className="flex">
          <DemoCard
            demo={demo}
            playing={playing === demo.id}
            onPlay={() => setPlaying(demo.id)}
            onStop={() => setPlaying(null)}
          />
        </li>
      ))}
    </ul>
  );
}

function DemoCard({
  demo,
  playing,
  onPlay,
  onStop,
}: {
  demo: Demo;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  const t = useTranslations("Demos");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const title = demo.title[locale];
  const published = demoPublishedAt(demo);

  return (
    <article className="flex w-full flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {playing ? (
          <>
            <iframe
              src={demoEmbedUrl(demo)}
              title={t("playerTitle", { title })}
              className="absolute inset-0 size-full"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <button
              type="button"
              onClick={onStop}
              autoFocus
              aria-label={t("close", { title })}
              className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X aria-hidden className="size-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            aria-label={
              demo.kind === "video"
                ? t("play", { title })
                : t("open", { title })
            }
            className="group absolute inset-0 size-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
          >
            <Image
              src={demoThumbnail(demo)}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <span className="flex size-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:bg-red-600 motion-reduce:transition-none">
                {demo.kind === "video" ? (
                  <Play aria-hidden className="ml-1 size-6 fill-current" />
                ) : (
                  <ImageIcon aria-hidden className="size-6" />
                )}
              </span>
            </span>
            {demo.kind === "video" && demo.duration ? (
              <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
                {formatDuration(demo.duration)}
              </span>
            ) : demo.kind === "image" ? (
              <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                {t("imageBadge")}
              </span>
            ) : null}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <h2 className="line-clamp-2 text-base leading-snug font-semibold text-balance">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {demo.author}
          <span aria-hidden> · </span>
          <time dateTime={published.toISOString()}>
            {format.dateTime(published, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </p>
        <a
          href={demoPostUrl(demo)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 rounded-sm text-sm font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {t("viewOnLinkedIn")}
          <ExternalLink aria-hidden className="size-3.5" />
          <span className="sr-only">{t("opensNewTab")}</span>
        </a>
      </div>
    </article>
  );
}
