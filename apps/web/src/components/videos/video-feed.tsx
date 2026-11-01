"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CAPTION_MODES,
  type CaptionMode,
  type Cue,
  DEFAULT_SETTINGS,
  FONT_MAX,
  FONT_MIN,
  SPEEDS,
  VIDEO_START_COMMAND,
  type Video,
  clampFontSize,
  fetchCues,
  fetchVideos,
  parseSettings,
  stepSpeed,
  videoSlug,
} from "@/lib/videos";

import { type Engagement, loadEngagement, setVideoLike } from "./actions";
import { VideoComments } from "./video-comments";
import { VideoSlide } from "./video-slide";

const SETTINGS_KEY = "vcv.videos.settings";
const FONT_STEP = 2;
const NO_CUES: readonly Cue[] = [];

function readSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return parseSettings(window.localStorage.getItem(SETTINGS_KEY));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function VideoFeed() {
  const t = useTranslations("Videos");
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState(0);
  // Nothing that depends on settings renders before the list loads, so hydration matches.
  const [settings, setSettings] = useState(readSettings);
  const [muted, setMuted] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [cues, setCues] = useState<Record<string, readonly Cue[]>>({});
  const [engagement, setEngagement] = useState<Record<string, Engagement>>({});
  const [notice, setNotice] = useState("");
  const feed = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  const update = useCallback((patch: Partial<typeof settings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); settings then last for the visit.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchVideos(controller.signal)
      .then((list) => {
        // A shared link opens on its video: `/videos#video-...`.
        const slug = decodeURIComponent(window.location.hash.slice(1));
        const index = list.findIndex((video) => videoSlug(video.base) === slug);
        setVideos(list);
        setActive(Math.max(index, 0));
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  const current = videos?.[active];
  const currentSlug = current ? videoSlug(current.base) : null;

  const scrollTo = useCallback((index: number, smooth = true) => {
    feed.current?.children[index]?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    if (!videos || restored.current) return;
    restored.current = true;
    if (active > 0) scrollTo(active, false);
  }, [videos, active, scrollTo]);

  useEffect(() => {
    const root = feed.current;
    if (!root || !videos) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive([...root.children].indexOf(entry.target));
          }
        }
      },
      { root, threshold: 0.6 },
    );
    for (const slide of root.children) observer.observe(slide);
    return () => observer.disconnect();
  }, [videos]);

  useEffect(() => {
    if (!current || !currentSlug) return;
    let live = true;
    if (restored.current) {
      window.history.replaceState(null, "", `#${currentSlug}`);
    }
    fetchCues(current)
      .then((list) => {
        if (live) setCues((all) => ({ ...all, [current.base]: list }));
      })
      .catch(() => undefined);
    void loadEngagement(currentSlug).then((data) => {
      if (live && data) {
        setEngagement((all) => ({ ...all, [currentSlug]: data }));
      }
    });
    return () => {
      live = false;
    };
  }, [current, currentSlug]);

  const toggleLike = useCallback(async () => {
    if (!currentSlug) return;
    const before = engagement[currentSlug] ?? {
      likes: 0,
      comments: 0,
      liked: false,
    };
    const liked = !before.liked;
    setEngagement((all) => ({
      ...all,
      [currentSlug]: {
        ...before,
        liked,
        likes: Math.max(0, before.likes + (liked ? 1 : -1)),
      },
    }));
    const saved = await setVideoLike(currentSlug, liked);
    setEngagement((all) => ({ ...all, [currentSlug]: saved ?? before }));
    if (!saved) setNotice(t("likeFailed"));
  }, [currentSlug, engagement, t]);

  const share = async () => {
    if (!currentSlug) return;
    const url = `${window.location.origin}${window.location.pathname}#${currentSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice(t("linkCopied"));
    } catch {
      setNotice(url);
    }
  };

  const refreshEngagement = () => {
    if (!currentSlug) return;
    void loadEngagement(currentSlug).then((data) => {
      if (data) setEngagement((all) => ({ ...all, [currentSlug]: data }));
    });
  };

  const blockedSound = useCallback(() => setMuted(true), []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      const count = videos?.length ?? 0;
      if (event.key === "ArrowDown" && active < count - 1) scrollTo(active + 1);
      else if (event.key === "ArrowUp" && active > 0) scrollTo(active - 1);
      else if (event.key === "+" || event.key === "=")
        update({ fontSize: clampFontSize(settings.fontSize + FONT_STEP) });
      else if (event.key === "-")
        update({ fontSize: clampFontSize(settings.fontSize - FONT_STEP) });
      else if (event.key === "]")
        update({ speed: stepSpeed(settings.speed, 1) });
      else if (event.key === "[")
        update({ speed: stepSpeed(settings.speed, -1) });
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, videos, settings, update, scrollTo]);

  if (failed) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-8">
        <h2 className="text-lg font-semibold">{t("offlineTitle")}</h2>
        <p className="text-muted-foreground">{t("offlineBody")}</p>
        <code className="max-w-full overflow-x-auto rounded bg-surface-muted px-2 py-1 text-sm">
          {VIDEO_START_COMMAND}
        </code>
        <Button onClick={() => setAttempt((value) => value + 1)}>
          {t("retry")}
        </Button>
      </div>
    );
  }
  if (videos === null) {
    return <p className="py-8 text-muted-foreground">{t("loading")}</p>;
  }
  if (videos.length === 0) {
    return <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        role="group"
        aria-label={t("controls")}
        className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm"
      >
        <div className="flex items-center gap-1">
          <span id="video-font-label" className="text-muted-foreground">
            {t("fontSize")}
          </span>
          <Button
            variant="ghost"
            className="size-8 min-h-8 p-0"
            aria-label={t("fontSmaller")}
            onClick={() =>
              update({ fontSize: clampFontSize(settings.fontSize - FONT_STEP) })
            }
          >
            <Minus aria-hidden className="size-4" />
          </Button>
          <input
            type="range"
            aria-labelledby="video-font-label"
            min={FONT_MIN}
            max={FONT_MAX}
            value={settings.fontSize}
            onChange={(event) =>
              update({ fontSize: Number(event.target.value) })
            }
            className="w-24 accent-accent"
          />
          <Button
            variant="ghost"
            className="size-8 min-h-8 p-0"
            aria-label={t("fontLarger")}
            onClick={() =>
              update({ fontSize: clampFontSize(settings.fontSize + FONT_STEP) })
            }
          >
            <Plus aria-hidden className="size-4" />
          </Button>
          <span className="w-10 text-right tabular-nums">
            {settings.fontSize}px
          </span>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("captions")}</span>
          <select
            value={settings.captions}
            onChange={(event) =>
              update({ captions: event.target.value as CaptionMode })
            }
            className="rounded border border-border bg-surface px-2 py-1"
          >
            {CAPTION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`captionModes.${mode}`)}
              </option>
            ))}
          </select>
        </label>

        <div
          role="group"
          aria-label={t("speed")}
          className="flex items-center gap-1"
        >
          <span aria-hidden className="hidden text-muted-foreground sm:inline">
            {t("speed")}
          </span>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              aria-pressed={settings.speed === speed}
              onClick={() => update({ speed })}
              className={cn(
                "h-8 rounded px-1.5 text-xs tabular-nums",
                settings.speed === speed
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-surface-muted",
              )}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div
          ref={feed}
          data-testid="video-feed"
          className="min-w-0 flex-1 snap-y snap-mandatory [scrollbar-width:none] overflow-y-scroll"
        >
          {videos.map((video, index) => (
            <VideoSlide
              key={video.base}
              video={video}
              active={index === active}
              loadMedia={Math.abs(index - active) <= 1}
              settings={settings}
              cues={cues[video.base] ?? NO_CUES}
              muted={muted}
              engagement={engagement[videoSlug(video.base)]}
              commentsOpen={commentsOpen}
              onToggleMuted={() => setMuted((value) => !value)}
              onBlockedSound={blockedSound}
              onToggleLike={() => void toggleLike()}
              onToggleComments={() => setCommentsOpen((open) => !open)}
              onShare={() => void share()}
            />
          ))}
        </div>
        {commentsOpen && current && currentSlug ? (
          <VideoComments
            slug={currentSlug}
            title={current.title}
            onClose={() => setCommentsOpen(false)}
            onPosted={refreshEngagement}
          />
        ) : null}
      </div>

      <p
        role="status"
        className={cn(
          "fixed bottom-4 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 truncate rounded bg-foreground px-3 py-1 text-sm text-background",
          !notice && "sr-only",
        )}
      >
        {notice}
      </p>
    </div>
  );
}
