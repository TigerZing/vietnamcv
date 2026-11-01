"use client";

import {
  ExternalLink,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  type Cue,
  type Video,
  type VideoSettings,
  captionLines,
  findCue,
  videoSource,
} from "@/lib/videos";

import type { Engagement } from "./actions";

const CAPTION_SECOND_LINE_SCALE = 0.72;

function RailButton({
  label,
  pressed,
  count,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        className="flex size-11 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
      >
        {children}
      </button>
      {count === undefined ? null : (
        <span className="rounded bg-black/70 px-1.5 text-xs text-white tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

export function VideoSlide({
  video,
  active,
  loadMedia,
  settings,
  cues,
  muted,
  engagement,
  commentsOpen,
  onToggleMuted,
  onBlockedSound,
  onToggleLike,
  onToggleComments,
  onShare,
}: {
  video: Video;
  active: boolean;
  /** Only the active video and its neighbours keep a media element. */
  loadMedia: boolean;
  settings: VideoSettings;
  cues: readonly Cue[];
  muted: boolean;
  engagement: Engagement | undefined;
  commentsOpen: boolean;
  onToggleMuted: () => void;
  onBlockedSound: () => void;
  onToggleLike: () => void;
  onToggleComments: () => void;
  onShare: () => void;
}) {
  const t = useTranslations("Videos");
  const element = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [cueIndex, setCueIndex] = useState(-1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const media = element.current;
    if (!media) return;
    if (!active) {
      media.pause();
      media.currentTime = 0;
      return;
    }
    media.play().catch((error: unknown) => {
      // Browsers refuse sound before the first gesture; start muted instead.
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        onBlockedSound();
      }
    });
  }, [active, onBlockedSound, muted]);

  useEffect(() => {
    if (element.current) element.current.playbackRate = settings.speed;
  }, [settings.speed, active, loadMedia]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const follow = () => {
      if (element.current) {
        setCueIndex(findCue(cues, element.current.currentTime));
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [active, cues]);

  const toggle = () => {
    const media = element.current;
    if (!media) return;
    if (media.paused) void media.play();
    else media.pause();
  };

  const { main, second } = captionLines(cues[cueIndex], settings.captions);

  return (
    <section
      aria-label={video.title}
      aria-current={active ? "true" : undefined}
      data-active={active}
      className="flex h-full snap-start snap-always justify-center py-1"
    >
      <div className="relative aspect-[9/16] h-full max-w-full overflow-hidden rounded-lg bg-black">
        {loadMedia ? (
          <video
            ref={element}
            src={videoSource(video)}
            aria-label={t("player", { title: video.title })}
            className="absolute inset-0 size-full object-contain"
            playsInline
            loop
            muted={muted}
            preload={active ? "auto" : "metadata"}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = settings.speed;
              setDuration(event.currentTarget.duration);
            }}
          />
        ) : null}

        <button
          type="button"
          aria-label={paused ? t("play") : t("pause")}
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center text-white"
        >
          {active && paused ? (
            <Play aria-hidden className="size-16 drop-shadow" />
          ) : (
            <Pause aria-hidden className="size-16 opacity-0" />
          )}
        </button>

        {main || second ? (
          <div
            data-testid="video-caption"
            className="pointer-events-none absolute inset-x-3 bottom-28 flex flex-col items-center gap-1 pr-12 text-center"
          >
            {main ? (
              <span
                style={{ fontSize: settings.fontSize }}
                className="rounded bg-black/75 px-2 py-0.5 leading-snug font-semibold whitespace-pre-line text-white"
              >
                {main}
              </span>
            ) : null}
            {second ? (
              <span
                style={{
                  fontSize: settings.fontSize * CAPTION_SECOND_LINE_SCALE,
                }}
                className="rounded bg-black/75 px-2 py-0.5 leading-snug whitespace-pre-line text-white"
              >
                {second}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3">
          <RailButton
            label={engagement?.liked ? t("unlike") : t("like")}
            pressed={engagement?.liked ?? false}
            count={engagement?.likes ?? 0}
            onClick={onToggleLike}
          >
            <Heart
              aria-hidden
              className={cn(
                "size-6",
                engagement?.liked && "fill-red-500 text-red-500",
              )}
            />
          </RailButton>
          <RailButton
            label={t("comments")}
            pressed={commentsOpen}
            count={engagement?.comments ?? 0}
            onClick={onToggleComments}
          >
            <MessageCircle aria-hidden className="size-6" />
          </RailButton>
          <RailButton label={t("share")} onClick={onShare}>
            <Share2 aria-hidden className="size-6" />
          </RailButton>
          <RailButton
            label={muted ? t("unmute") : t("mute")}
            onClick={onToggleMuted}
          >
            {muted ? (
              <VolumeX aria-hidden className="size-6" />
            ) : (
              <Volume2 aria-hidden className="size-6" />
            )}
          </RailButton>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-black/75 px-3 pt-2 pb-1 text-white">
          <p className="truncate text-sm font-semibold">{video.uploader}</p>
          <p className="line-clamp-2 text-xs">{video.title}</p>
          <div className="flex items-center gap-2">
            <input
              type="range"
              aria-label={t("seek")}
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(time, duration || 0)}
              onChange={(event) => {
                if (element.current) {
                  element.current.currentTime = Number(event.target.value);
                }
              }}
              className="h-5 min-w-0 flex-1 accent-white"
            />
            {video.url ? (
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("openOriginal")}
                className="flex size-6 shrink-0 items-center justify-center"
              >
                <ExternalLink aria-hidden className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
