"use client";

import { Image as ImageIcon, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { type Demo, demoEmbedUrl, demoThumbnail } from "@/lib/demos";

/**
 * LinkedIn's embed player for one demo. With `autoplay` (the viewer picked this demo
 * from the list) the player loads at once; otherwise the thumbnail waits for a press,
 * so nothing loads from LinkedIn before the viewer asks for it.
 */
export function DemoPlayer({
  demo,
  title,
  autoplay,
}: {
  demo: Demo;
  title: string;
  autoplay: boolean;
}) {
  const t = useTranslations("Demos");
  const [playing, setPlaying] = useState(autoplay);
  const frame = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLIFrameElement>(null);
  const src = demoEmbedUrl(demo);

  // Next keeps recently left pages mounted but hidden, and a hidden iframe keeps
  // playing. Blank the frame while hidden and restore it when shown again.
  useLayoutEffect(() => {
    const element = player.current;
    if (!element) return;
    if (element.src !== src) element.src = src;
    return () => {
      element.src = "about:blank";
    };
  }, [playing, src]);

  // On narrow screens the list sits below the player: bring the player into view.
  useEffect(() => {
    if (!autoplay || window.matchMedia("(min-width: 1024px)").matches) return;
    frame.current?.scrollIntoView({ block: "start" });
  }, [autoplay, demo.id]);

  return (
    <div
      ref={frame}
      className="relative aspect-video scroll-mt-20 overflow-hidden rounded-xl bg-black"
    >
      {playing ? (
        <iframe
          ref={player}
          key={demo.id}
          src={src}
          title={t("playerTitle", { title })}
          className="absolute inset-0 size-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={
            demo.kind === "video" ? t("play", { title }) : t("open", { title })
          }
          className="group absolute inset-0 size-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
        >
          <Image
            src={demoThumbnail(demo)}
            alt=""
            fill
            unoptimized
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
            <span className="flex size-16 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:bg-red-600 motion-reduce:transition-none">
              {demo.kind === "video" ? (
                <Play aria-hidden className="ml-1 size-7 fill-current" />
              ) : (
                <ImageIcon aria-hidden className="size-7" />
              )}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
