import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEMOS,
  demoEmbedUrl,
  demoPublishedAt,
  demoThumbnail,
  formatDuration,
  isLinkedInUrn,
} from "@/lib/demos";

describe("demos", () => {
  it("has unique ids and posts, each with a valid URN and a thumbnail file", () => {
    expect(new Set(DEMOS.map((demo) => demo.id)).size).toBe(DEMOS.length);
    expect(new Set(DEMOS.map((demo) => demo.urn)).size).toBe(DEMOS.length);
    for (const demo of DEMOS) {
      expect(isLinkedInUrn(demo.urn), demo.urn).toBe(true);
      expect(demo.title.vi.trim()).not.toBe("");
      expect(demo.title.en.trim()).not.toBe("");
      const file = path.join(process.cwd(), "public", demoThumbnail(demo));
      expect(existsSync(file), file).toBe(true);
    }
  });

  it("embeds the compact LinkedIn player", () => {
    expect(demoEmbedUrl(DEMOS[0]!)).toBe(
      "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7520372769973350400?compact=1",
    );
  });

  it("reads the publish time from the LinkedIn id", () => {
    const demo = DEMOS.find((d) => d.id === "10")!;
    // urn:li:activity:7513670993253642240 was posted in 2026.
    expect(demoPublishedAt(demo).getUTCFullYear()).toBe(2026);
    expect(isLinkedInUrn("urn:li:activity:123")).toBe(false);
    expect(
      isLinkedInUrn("https://evil.example/urn:li:activity:7513670993253642240"),
    ).toBe(false);
  });

  it("formats durations like a video player", () => {
    expect(formatDuration(7)).toBe("0:07");
    expect(formatDuration(66.6)).toBe("1:07");
  });
});
