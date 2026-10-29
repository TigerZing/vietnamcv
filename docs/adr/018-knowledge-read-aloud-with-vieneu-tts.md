# ADR-018: Read-aloud for Knowledge articles with VieNeu-TTS

- Status: Accepted
- Date: 2026-10-29

## Context

The owner asked for the Knowledge articles (`/knowledge/cnn`, `/knowledge/transformer`)
to be read aloud with [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS): a switch to
turn it on, then reading either one section or the whole page.

VieNeu-TTS v3 Turbo is a 0.1B-parameter Vietnamese/English speech model. Code, weights
and preset voices are Apache-2.0
([model card](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo)), and audio made
with the preset voices may be used commercially; the notice and attribution to
pnnbao97/VieNeu-TTS must be kept when the assets are redistributed. It runs on CPU
through ONNX Runtime (about twice real time on a laptop CPU, no GPU needed), outputs
48 kHz audio and pulls in ONNX Runtime, librosa, gradio and a ~300 MB model download
from Hugging Face.

Options considered:

1. **Synthesize on request** in the API (`POST /api/v1/tts`). Every listener waits for
   synthesis, the API image grows by the model and its dependencies, and CPU load scales
   with listeners, all for text that only changes when an editor edits it.
2. **Pre-generate** one recording per section offline and serve it as a static file.
3. **Browser voice only** (Web Speech API). No cost, but quality depends on the device
   and many devices have no Vietnamese voice.

## Decision

Option 2, with option 3 as the fallback.

- **Generator.** `tools/knowledge-tts/generate.py` reads each section of
  `Knowledge.<topic>.sections` from `messages/<locale>.json`, turns it into speech text
  (title, paragraphs, list items as sentences; `×` and `−` said as words; formulas
  skipped), synthesizes it with the preset voice "Minh Triết" (male, Southern accent; the owner's choice) and writes
  `public/knowledge/audio/<locale>/<topic>/<section>-<hash>.mp3`.
  `src/content/knowledge-audio.json` records each file with a hash of the section's
  title and body. Unchanged sections are skipped. `scripts/run.sh tts` sets up a
  virtual environment, runs it on the owner's computer and rebuilds the web image.
  Vietnamese only by default (`--locale vi en` adds English).
- **Stale audio is never played.** The page computes the same hash at build time and
  only passes a recording to the player while it matches the current copy; an edited
  section is read by the browser voice until the generator runs again.
- **Player** (`components/knowledge/read-aloud.tsx`). A "Đọc to" switch in the article
  header turns read-aloud on and starts reading from the first section; each section
  heading then gets a speaker button that reads only that section, and a bar fixed to
  the bottom of the screen has previous / play-pause / next, the current section, which
  voice is speaking, speed (0.75–1.5×) and a close button. "Read the whole page" goes
  on to the next section and scrolls to it; a single section stops at its end. The
  section being read is highlighted. Whether the switch is on is remembered in
  `localStorage`, but reading only starts on a press.
- **Browser fallback.** Sections without a current recording are read with
  `speechSynthesis` in `vi-VN` / `en-US`, split into sentences of at most 220 characters
  (Chrome stops longer utterances). A recording that fails to load also falls back.

## Consequences

- About 13 minutes of Vietnamese audio (all 18 sections), roughly 5 MB of MP3 in the
  repository once recorded. Recording takes about 10 minutes on a laptop CPU.
- The cloud build environment cannot reach Hugging Face, so recordings are made on the
  owner's computer; until then every section uses the browser voice.
- VieNeu-TTS adds an inaudible watermark to its output (its default), marking the audio
  as AI-generated.
- Copy edits need `scripts/run.sh tts` to refresh their recordings; the page stays
  correct in between because of the hash check.
- VieNeu-TTS's v4 is proprietary and API-only; this integration stays on the open v3
  Turbo.
