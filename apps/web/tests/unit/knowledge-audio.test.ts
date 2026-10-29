import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "../../src/content/knowledge-audio.json";
import vi from "../../messages/vi.json";
import en from "../../messages/en.json";
import { sectionAudio, sectionHash } from "@/lib/knowledge-audio";
import { speechChunks, speechText } from "@/lib/knowledge-speech";

const SAMPLE = {
  title: "Phép convolution",
  body: "Một kernel 3 × 3.\n\n- Stride S: bước trượt",
};

describe("knowledge read-aloud", () => {
  it("hashes section text the same way as the generator script", () => {
    // Value printed by `section_hash` in tools/knowledge-tts/generate.py.
    expect(sectionHash(SAMPLE.title, SAMPLE.body)).toBe("54092120061d3784");
  });

  it("reads the title, paragraphs and list items as sentences", () => {
    // Same output as `speech_text` in tools/knowledge-tts/generate.py.
    expect(speechText("vi", SAMPLE.title, SAMPLE.body)).toBe(
      "Phép convolution. Một kernel 3 nhân 3. Stride S: bước trượt.",
    );
    expect(speechText("en", "Pooling", "A 2 × 2 window")).toBe(
      "Pooling. A 2 by 2 window.",
    );
  });

  it("splits text into short pieces for the browser voice", () => {
    for (const messages of [vi, en]) {
      for (const topic of ["cnn", "transformer"] as const) {
        for (const section of Object.values(
          messages.Knowledge[topic].sections,
        )) {
          const text = speechText("vi", section.title, section.body);
          const chunks = speechChunks(text);
          expect(chunks.join(" ")).toBe(text);
          for (const chunk of chunks)
            expect(chunk.length).toBeLessThanOrEqual(220);
        }
      }
    }
  });

  it("lists only recordings that exist for real sections", () => {
    const sections: Record<string, { src: string; hash: string }> =
      manifest.sections;
    for (const [key, entry] of Object.entries(sections)) {
      const [locale, topic, id] = key.split("/") as [
        "vi" | "en",
        "cnn",
        string,
      ];
      const messages = locale === "vi" ? vi : en;
      const section = (
        messages.Knowledge[topic].sections as Record<
          string,
          { title: string; body: string }
        >
      )[id];
      expect(section, key).toBeDefined();
      expect(entry.src).toMatch(
        new RegExp(
          `^/knowledge/audio/${locale}/${topic}/${id}-[0-9a-f]{8}\\.mp3$`,
        ),
      );
      expect(existsSync(path.join(__dirname, "../../public", entry.src))).toBe(
        true,
      );
    }
  });

  it("ignores a recording whose text has changed since it was made", () => {
    expect(
      sectionAudio("vi", "cnn", "convolution", {
        title: "Không có bản ghi",
        body: "Văn bản khác",
      }),
    ).toBeUndefined();
  });
});
