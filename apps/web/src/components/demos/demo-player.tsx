"use client";

import { Image as ImageIcon, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { type Demo, demoEmbedUrl, demoThumbnail, demoVideo } from "@/lib/demos";

/**
 * The player for one demo. Videos are served from this site (ADR-014), so a demo picked
 * from the list (`autoplay`) starts at once. Image posts open LinkedIn's embed. Without
 * `autoplay` nothing plays or loads until the viewer presses the thumbnail.
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
  const frame = useRef<HTMLDivElement>(null);

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
      {demo.kind === "video" ? (
        <VideoPlayer
          key={demo.id}
          demo={demo}
          title={title}
          autoplay={autoplay}
        />
      ) : (
        <LinkedInFrame
          key={demo.id}
          demo={demo}
          title={title}
          autoplay={autoplay}
        />
      )}
    </div>
  );
}

function VideoPlayer({
  demo,
  title,
  autoplay,
}: {
  demo: Demo;
  title: string;
  autoplay: boolean;
}) {
  const t = useTranslations("Demos");
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(autoplay);

  // Next keeps recently left pages mounted but hidden: pause when hidden, and start
  // (again) when shown. A browser that blocks sound without a fresh press still gets
  // the video playing, muted, with its controls to turn the sound on.
  useLayoutEffect(() => {
    const element = video.current;
    if (!element || !started) return;
    element.play().catch(() => {
      element.muted = true;
      return element.play().catch(() => undefined);
    });
    return () => element.pause();
  }, [started]);

  return (
    <>
      <video
        ref={video}
        src={demoVideo(demo)}
        poster={demoThumbnail(demo)}
        aria-label={t("playerTitle", { title })}
        className="absolute inset-0 size-full"
        controls={started}
        playsInline
        preload={started ? "auto" : "none"}
      />
      {started ? null : (
        <PlayButton
          demo={demo}
          label={t("play", { title })}
          onPress={() => setStarted(true)}
        />
      )}
    </>
  );
}

function LinkedInFrame({
  demo,
  title,
  autoplay,
}: {
  demo: Demo;
  title: string;
  autoplay: boolean;
}) {
  const t = useTranslations("Demos");
  const [open, setOpen] = useState(autoplay);
  const player = useRef<HTMLIFrameElement>(null);
  const src = demoEmbedUrl(demo);

  // A hidden page keeps its iframe: blank it while hidden, restore it when shown.
  useLayoutEffect(() => {
    const element = player.current;
    if (!element) return;
    if (element.src !== src) element.src = src;
    return () => {
      element.src = "about:blank";
    };
  }, [open, src]);

  if (!open)
    return (
      <PlayButton
        demo={demo}
        label={t("open", { title })}
        onPress={() => setOpen(true)}
      />
    );
  return (
    <iframe
      ref={player}
      src={src}
      title={t("postTitle", { title })}
      className="absolute inset-0 size-full"
      allow="encrypted-media; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}

function PlayButton({
  demo,
  label,
  onPress,
}: {
  demo: Demo;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
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
  );
}
