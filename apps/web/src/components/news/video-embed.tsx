"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { youtubeEmbedUrl, youtubeThumbnail } from "@/lib/youtube";

/**
 * Click-to-play YouTube embed. Nothing loads from YouTube except the thumbnail until the
 * viewer presses play, which keeps the page fast and avoids tracking by default.
 */
export function VideoEmbed({
  id,
  title,
}: {
  id: string;
  title: string | null;
}) {
  const t = useTranslations("News.video");
  const [playing, setPlaying] = useState(false);
  const label = title ?? t("fallbackTitle");

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(id)}
            title={label}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 size-full"
          >
            <Image
              src={youtubeThumbnail(id)}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 768px) 720px, 100vw"
              className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110 motion-reduce:transition-none">
                <Play aria-hidden className="ml-1 size-7 fill-current" />
              </span>
            </span>
            <span className="sr-only">{t("play", { title: label })}</span>
          </button>
        )}
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {title ? <span className="font-medium">{title}. </span> : null}
        {t("provider")}
      </figcaption>
    </figure>
  );
}
