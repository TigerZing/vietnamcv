import { z } from "zod";

/** The owner's local viewer, started with `bash fb_videos/xem.sh` (ADR-019). */
export const VIDEO_SERVER_URL = "http://localhost:8765";
export const VIDEO_START_COMMAND =
  "bash ~/Documents/VietnamCV/fb_videos/xem.sh";

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const CAPTION_MODES = ["both", "vi", "orig", "off"] as const;
export const FONT_MIN = 12;
export const FONT_MAX = 40;
const FONT_DEFAULT = 20;
/** A cue stays on screen this long after it ends, so short gaps do not flicker. */
const CUE_GRACE_SECONDS = 0.15;
const SLUG_MAX = 200;

export type CaptionMode = (typeof CAPTION_MODES)[number];
export type VideoSettings = {
  fontSize: number;
  speed: number;
  captions: CaptionMode;
};

export const DEFAULT_SETTINGS: VideoSettings = {
  fontSize: FONT_DEFAULT,
  speed: 1,
  captions: "both",
};

const videoSchema = z.object({
  file: z.string().min(1),
  base: z.string().min(1),
  title: z.string(),
  uploader: z.string(),
  url: z.string(),
  has_vi: z.boolean(),
  has_orig: z.boolean(),
});
const videoListSchema = z.object({ videos: z.array(videoSchema) });
const cueSchema = z.object({
  start: z.number(),
  end: z.number(),
  orig: z.string(),
  vi: z.string(),
});
const cueListSchema = z.object({ cues: z.array(cueSchema) });

export type Video = z.infer<typeof videoSchema>;
export type Cue = z.infer<typeof cueSchema>;

export async function fetchVideos(signal?: AbortSignal): Promise<Video[]> {
  const response = await fetch(`${VIDEO_SERVER_URL}/api/videos`, { signal });
  if (!response.ok) throw new Error(`video list: ${response.status}`);
  return videoListSchema.parse(await response.json()).videos;
}

export async function fetchCues(video: Video): Promise<Cue[]> {
  if (!video.has_vi && !video.has_orig) return [];
  const response = await fetch(
    `${VIDEO_SERVER_URL}/api/cues/${encodeURIComponent(video.base)}`,
  );
  if (!response.ok) throw new Error(`cues: ${response.status}`);
  return cueListSchema.parse(await response.json()).cues;
}

export function videoSource(video: Video): string {
  return `${VIDEO_SERVER_URL}/video/${encodeURIComponent(video.file)}`;
}

/** The API slug of a file name: stable, so likes and comments follow the video. */
export function videoSlug(base: string): string {
  const words = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `video-${words}`.slice(0, SLUG_MAX).replace(/-+$/, "");
}

/** Index of the cue on screen at `time`, or -1. Cues are sorted by start. */
export function findCue(cues: readonly Cue[], time: number): number {
  let low = 0;
  let high = cues.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle]!.start <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found >= 0 && time <= cues[found]!.end + CUE_GRACE_SECONDS
    ? found
    : -1;
}

/** The lines to draw for a cue. Vietnamese comes first; identical lines show once. */
export function captionLines(cue: Cue | undefined, mode: CaptionMode) {
  if (!cue || mode === "off") return { main: "", second: "" };
  if (mode === "orig") return { main: cue.orig, second: "" };
  if (mode === "vi") return { main: cue.vi || cue.orig, second: "" };
  return cue.vi
    ? { main: cue.vi, second: cue.orig === cue.vi ? "" : cue.orig }
    : { main: cue.orig, second: "" };
}

export function clampFontSize(size: number): number {
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(size)));
}

/** Moves one step along SPEEDS, stopping at either end. */
export function stepSpeed(speed: number, step: 1 | -1): number {
  const index = SPEEDS.indexOf(speed as (typeof SPEEDS)[number]);
  const next = Math.min(SPEEDS.length - 1, Math.max(0, index + step));
  return SPEEDS[next]!;
}

/** Reads saved settings; anything missing or invalid falls back to the default. */
export function parseSettings(raw: string | null): VideoSettings {
  const schema = z.object({
    fontSize: z.number().min(FONT_MIN).max(FONT_MAX).catch(FONT_DEFAULT),
    speed: z
      .number()
      .refine((value) => (SPEEDS as readonly number[]).includes(value))
      .catch(1),
    captions: z.enum(CAPTION_MODES).catch("both"),
  });
  try {
    return schema.parse(JSON.parse(raw ?? "{}"));
  } catch {
    return DEFAULT_SETTINGS;
  }
}
