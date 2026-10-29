import { createHash } from "node:crypto";

import manifest from "@/content/knowledge-audio.json";
import type { Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/knowledge";

/**
 * Read-aloud for the Knowledge articles (ADR-018). `tools/knowledge-tts/generate.py`
 * pre-generates one MP3 per section with VieNeu-TTS and lists it in
 * `src/content/knowledge-audio.json` with a hash of the text it was made from. A file is
 * only used while that hash matches the current copy; any other section is read by the
 * browser's own voice (Web Speech API).
 */

export type AudioEntry = {
  hash: string;
  voice: string;
  src: string;
  seconds: number;
};

const SECTIONS: Record<string, AudioEntry | undefined> = manifest.sections;

export const AUDIO_MODEL = manifest.model;

/** Must match `section_hash` in tools/knowledge-tts/generate.py. */
export function sectionHash(title: string, body: string): string {
  return createHash("sha256")
    .update(`${title}\n\n${body}`)
    .digest("hex")
    .slice(0, 16);
}

/** The pre-generated recording of a section, if one exists for its current text. */
export function sectionAudio(
  locale: Locale,
  topic: TopicId,
  id: string,
  section: { title: string; body: string },
): AudioEntry | undefined {
  const entry = SECTIONS[`${locale}/${topic}/${id}`];
  return entry && entry.hash === sectionHash(section.title, section.body)
    ? entry
    : undefined;
}
