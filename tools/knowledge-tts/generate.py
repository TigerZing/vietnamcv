"""Pre-generate the read-aloud audio of the Knowledge articles with VieNeu-TTS.

Reads every section of `Knowledge.<topic>.sections` in `apps/web/messages/<locale>.json`,
synthesizes it with VieNeu-TTS v3 Turbo (Apache-2.0, runs on CPU through ONNX Runtime)
and writes one MP3 per section to `apps/web/public/knowledge/audio/<locale>/<topic>/`.
`apps/web/src/content/knowledge-audio.json` lists the files with a hash of the text
they were made from; the web page only plays a file whose hash still matches the current
text and falls back to the browser's own voice otherwise (ADR-018).

Unchanged sections are skipped, so a rerun after a copy edit only renders what changed.

    python generate.py                     # Vietnamese, voice "Mai Anh"
    python generate.py --locale vi en      # also English
    python generate.py --voice "Hải Đăng" --force
    python generate.py --topic cnn --section convolution
"""

# ruff: noqa: T201, PLC0415 (a command-line script: it prints, and loads the model late)

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "apps" / "web"
MESSAGES = WEB / "messages"
AUDIO_DIR = WEB / "public" / "knowledge" / "audio"
MANIFEST = WEB / "src" / "content" / "knowledge-audio.json"
MODEL = "VieNeu-TTS v3 Turbo"
DEFAULT_VOICE = "Mai Anh"

# Symbols the articles use that a reader says as words (multiplication and minus signs
# are written as escapes).
SPOKEN_SYMBOLS = {
    "vi": {
        "\u00d7": " nhân ",
        "\u2212": " trừ ",
        "→": " thành ",
        "≈": " xấp xỉ ",
        "%": " phần trăm",
    },
    "en": {"\u00d7": " by ", "\u2212": " minus ", "→": " to ", "≈": " about ", "%": " percent"},
}


def section_hash(title: str, body: str) -> str:
    """Must match `sectionHash` in apps/web/src/lib/knowledge-audio.ts."""
    return hashlib.sha256(f"{title}\n\n{body}".encode()).hexdigest()[:16]


def speech_text(locale: str, title: str, body: str) -> str:
    """What is read aloud: the title, then the paragraphs and list items as sentences.

    Mirrors `speechText` in apps/web/src/lib/knowledge-speech.ts (the browser fallback).
    """
    parts = [title]
    for raw in body.split("\n"):
        line = raw.strip()
        if line:
            parts.append(line[2:].strip() if line.startswith("- ") else line)
    sentences = [part if re.search(r"[.!?…:;]$", part) else f"{part}." for part in parts]
    text = " ".join(sentences)
    for symbol, words in SPOKEN_SYMBOLS[locale].items():
        text = text.replace(symbol, words)
    return re.sub(r"\s+", " ", text).strip()


def load_manifest() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"model": MODEL, "sections": {}}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--locale", nargs="+", default=["vi"], choices=["vi", "en"])
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="VieNeu-TTS preset voice")
    parser.add_argument("--topic", help="only this topic (cnn, transformer)")
    parser.add_argument("--section", help="only this section id")
    parser.add_argument("--force", action="store_true", help="render even if unchanged")
    parser.add_argument("--list-voices", action="store_true")
    args = parser.parse_args()

    # Imported late so --help works before the packages are installed.
    import soundfile as sf
    from vieneu import Vieneu

    print(f"Loading {MODEL} (the first run downloads the model, about 300 MB)…")
    tts = Vieneu(mode="v3turbo")
    if args.list_voices:
        for label, name in tts.list_preset_voices():
            print(f"{name}\t{label}")
        return 0
    voice = tts.get_preset_voice(args.voice)

    manifest = load_manifest()
    manifest["model"] = MODEL
    entries: dict = manifest.setdefault("sections", {})
    rendered = skipped = 0

    for locale in args.locale:
        knowledge = json.loads((MESSAGES / f"{locale}.json").read_text(encoding="utf-8"))[
            "Knowledge"
        ]
        for topic in knowledge["topics"]:
            if args.topic and topic != args.topic:
                continue
            for section_id, section in knowledge[topic]["sections"].items():
                if args.section and section_id != args.section:
                    continue
                key = f"{locale}/{topic}/{section_id}"
                digest = section_hash(section["title"], section["body"])
                current = entries.get(key)
                if (
                    not args.force
                    and current
                    and current["hash"] == digest
                    and current["voice"] == args.voice
                    and (WEB / "public" / current["src"].lstrip("/")).exists()
                ):
                    skipped += 1
                    continue

                text = speech_text(locale, section["title"], section["body"])
                started = time.monotonic()
                audio = tts.infer(text, voice=voice)
                out_dir = AUDIO_DIR / locale / topic
                out_dir.mkdir(parents=True, exist_ok=True)
                for old in out_dir.glob(f"{section_id}-*.mp3"):
                    old.unlink()
                out = out_dir / f"{section_id}-{digest[:8]}.mp3"
                sf.write(out, audio, tts.sample_rate, format="MP3", compression_level=0.6)
                seconds = round(len(audio) / tts.sample_rate, 1)
                entries[key] = {
                    "hash": digest,
                    "voice": args.voice,
                    "src": "/" + out.relative_to(WEB / "public").as_posix(),
                    "seconds": seconds,
                }
                rendered += 1
                elapsed = time.monotonic() - started
                print(f"  {key}: {seconds:.0f} s of audio in {elapsed:.0f} s")
                # Saved after every section so an interrupted run keeps its progress.
                manifest["sections"] = dict(sorted(entries.items()))
                MANIFEST.write_text(
                    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
                )

    print(f"Done: {rendered} rendered, {skipped} unchanged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
