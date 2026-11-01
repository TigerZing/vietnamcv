import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  captionLines,
  clampFontSize,
  findCue,
  parseSettings,
  stepSpeed,
  videoSlug,
} from "@/lib/videos";

const cue = (start: number, end: number, vi = "xin chào", orig = "hello") => ({
  start,
  end,
  vi,
  orig,
});

describe("videos", () => {
  it("turns a file name into a slug the API accepts", () => {
    expect(videoSlug("2026-09-02_Graduateml_1397856995822151")).toBe(
      "video-2026-09-02-graduateml-1397856995822151",
    );
    expect(videoSlug("__Có dấu & cách.mp4__")).toMatch(
      /^video-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    );
    expect(videoSlug("x".repeat(300)).length).toBeLessThanOrEqual(200);
  });

  it("finds the cue on screen and leaves gaps empty", () => {
    const cues = [cue(1, 2), cue(5, 6)];
    expect(findCue(cues, 0.5)).toBe(-1);
    expect(findCue(cues, 1.5)).toBe(0);
    expect(findCue(cues, 2.1)).toBe(0);
    expect(findCue(cues, 3)).toBe(-1);
    expect(findCue(cues, 5)).toBe(1);
    expect(findCue([], 1)).toBe(-1);
  });

  it("picks caption lines for each mode", () => {
    const line = cue(0, 1);
    expect(captionLines(line, "both")).toEqual({
      main: "xin chào",
      second: "hello",
    });
    expect(captionLines(line, "orig").main).toBe("hello");
    expect(captionLines(line, "off").main).toBe("");
    expect(captionLines(cue(0, 1, "", "hello"), "vi").main).toBe("hello");
    expect(captionLines(cue(0, 1, "same", "same"), "both").second).toBe("");
  });

  it("keeps text size and speed in range", () => {
    expect(clampFontSize(5)).toBe(12);
    expect(clampFontSize(99)).toBe(40);
    expect(stepSpeed(1, 1)).toBe(1.25);
    expect(stepSpeed(2, 1)).toBe(2);
    expect(stepSpeed(0.5, -1)).toBe(0.5);
  });

  it("restores saved settings and ignores bad values", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("not json")).toEqual(DEFAULT_SETTINGS);
    expect(
      parseSettings('{"fontSize":30,"speed":1.5,"captions":"vi"}'),
    ).toEqual({ fontSize: 30, speed: 1.5, captions: "vi" });
    expect(parseSettings('{"fontSize":500,"speed":9,"captions":"x"}')).toEqual(
      DEFAULT_SETTINGS,
    );
  });
});
