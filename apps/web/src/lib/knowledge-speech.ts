import type { Locale } from "@/i18n/routing";

// Symbols the articles use that a reader says as words.
const SPOKEN_SYMBOLS: Record<Locale, Record<string, string>> = {
  vi: {
    "×": " nhân ",
    "−": " trừ ",
    "→": " thành ",
    "≈": " xấp xỉ ",
    "%": " phần trăm",
  },
  en: {
    "×": " by ",
    "−": " minus ",
    "→": " to ",
    "≈": " about ",
    "%": " percent",
  },
};

/**
 * What is read aloud: the title, then the paragraphs and list items as sentences.
 * Mirrors `speech_text` in tools/knowledge-tts/generate.py.
 */
export function speechText(locale: Locale, title: string, body: string) {
  const parts = [title];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    parts.push(line.startsWith("- ") ? line.slice(2).trim() : line);
  }
  let text = parts
    .map((part) => (/[.!?…:;]$/.test(part) ? part : `${part}.`))
    .join(" ");
  for (const [symbol, words] of Object.entries(SPOKEN_SYMBOLS[locale]))
    text = text.replaceAll(symbol, words);
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Splits text into sentence-sized pieces for the browser voice: Chrome stops long
 * utterances after about 15 seconds, so each piece stays under `max` characters.
 */
export function speechChunks(text: string, max = 220): string[] {
  const chunks: string[] = [];
  for (const sentence of text.split(/(?<=[.!?…:;])\s+/)) {
    if (!sentence) continue;
    if (sentence.length <= max) {
      chunks.push(sentence);
      continue;
    }
    let current = "";
    for (const word of sentence.split(/\s+/)) {
      if (current && current.length + word.length + 1 > max) {
        chunks.push(current);
        current = word;
      } else current = current ? `${current} ${word}` : word;
    }
    if (current) chunks.push(current);
  }
  return chunks;
}
