"use client";

import { Image as ImageIcon, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  type Demo,
  demoEmbedUrl,
  demoThumbnail,
  demoVideoUrl,
} from "@/lib/demos";

/**
 * The player for one demo. Videos play from our own copy of the clip; image posts use
 * LinkedIn's embed. With `autoplay` (the viewer picked this demo from the list) the
 * video starts at once; otherwise the thumbnail waits for a press.
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
  const video = useRef<HTMLVideoElement>(null);
  const src = demoEmbedUrl(demo);
  const clip = demoVideoUrl(demo);

  // Next keeps recently left pages mounted but hidden, and a hidden player keeps
  // playing. Unload the player while hidden and restore it when shown again.
  useLayoutEffect(() => {
    const element = player.current;
    if (!element) return;
    if (element.src !== src) element.src = src;
    return () => {
      element.src = "about:blank";
    };
  }, [playing, src]);

  useLayoutEffect(() => {
    const element = video.current;
    if (!element || !clip) return;
    element.src = clip;
    // A page opened straight from a link has had no click yet, so the browser only
    // lets the clip start muted; the viewer can unmute it from the controls.
    element.play().catch(() => {
      element.muted = true;
      element.play().catch(() => {});
    });
    return () => {
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [playing, clip]);

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
      {playing && clip ? (
        <video
          ref={video}
          key={demo.id}
          poster={demoThumbnail(demo)}
          aria-label={t("playerTitle", { title })}
          className="absolute inset-0 size-full object-contain"
          controls
          playsInline
          preload="auto"
        />
      ) : playing ? (
        <iframe
          ref={player}
          key={demo.id}
          src={src}
          title={t("postTitle", { title })}
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
