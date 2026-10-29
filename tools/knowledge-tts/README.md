# Knowledge read-aloud audio (VieNeu-TTS)

Records the sections of the Knowledge articles with
[VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) v3 Turbo (Apache-2.0, by
pnnbao97; model `pnnbao-ump/VieNeu-TTS-v3-Turbo`). See ADR-018.

```bash
scripts/run.sh tts                       # Vietnamese, voice "Mai Anh"
scripts/run.sh tts --locale vi en        # also English
scripts/run.sh tts --voice "Hải Đăng" --force
scripts/run.sh tts --list-voices
```

Needs Python 3.10+ and about 1.5 GB of disk for the packages and model; a CPU is
enough. The first run downloads the model from Hugging Face. Only sections whose text
changed are recorded again. Output:

- `apps/web/public/knowledge/audio/<locale>/<topic>/<section>-<hash>.mp3`
- `apps/web/src/content/knowledge-audio.json` (file, voice, length and text hash)

Commit both. The page ignores a recording whose hash no longer matches the section's
text and uses the browser's voice for that section instead.

Audio made with the preset voices may be used commercially; keep this attribution to
VieNeu-TTS when redistributing it.
