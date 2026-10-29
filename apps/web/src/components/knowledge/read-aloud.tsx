"use client";

import {
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import type { Locale } from "@/i18n/routing";
import { speechChunks } from "@/lib/knowledge-speech";
import { cn } from "@/lib/utils";

/** One readable section: its text, and the VieNeu-TTS recording when one is current. */
export type ReadItem = {
  id: string;
  title: string;
  text: string;
  audio?: { src: string; voice: string };
};

type Status = "idle" | "playing" | "paused";
type Scope = "page" | "section";
type Engine = "audio" | "speech";

type ReaderState = {
  enabled: boolean;
  current: number | null;
  scope: Scope;
  status: Status;
  engine: Engine | null;
};

const IDLE: ReaderState = {
  enabled: false,
  current: null,
  scope: "page",
  status: "idle",
  engine: null,
};

const STORAGE_KEY = "vietnamcv-read-aloud";
const RATES = [0.75, 1, 1.25, 1.5] as const;

/**
 * Plays the sections one after another: a section with a recording through an `<audio>`
 * element, any other through the browser's speech synthesis, sentence by sentence.
 * Every start or stop bumps `token`, so callbacks from an interrupted section do nothing.
 */
class Reader {
  state: ReaderState = IDLE;
  rate = 1;
  private token = 0;
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private items: readonly ReadItem[],
    private lang: string,
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = () => this.state;

  private set(next: Partial<ReaderState>) {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }

  play(index: number, scope: Scope) {
    this.halt();
    const token = this.token;
    const item = this.items[index];
    if (!item) return this.stop();
    const done = () => {
      if (token !== this.token) return;
      const following = this.items[index + 1];
      if (this.state.scope === "page" && following) {
        this.play(index + 1, "page");
        document
          .getElementById(following.id)
          ?.scrollIntoView({ block: "start" });
      } else if (this.state.scope === "page") {
        this.stop();
        this.set({ current: null });
      } else this.stop();
    };
    if (item.audio) {
      this.set({ current: index, scope, status: "playing", engine: "audio" });
      const audio = (this.audio ??= new Audio());
      audio.src = item.audio.src;
      audio.playbackRate = this.rate;
      audio.onended = done;
      // A missing or blocked file falls back to the browser voice.
      const fallback = () => {
        if (token !== this.token) return;
        audio.onerror = null;
        this.speak(item.text, token, done);
      };
      audio.onerror = fallback;
      audio.play().catch(fallback);
    } else {
      this.set({ current: index, scope, status: "playing" });
      this.speak(item.text, token, done);
    }
  }

  private speak(text: string, token: number, done: () => void) {
    const synth =
      typeof window === "undefined" ? undefined : window.speechSynthesis;
    if (!synth) return this.stop();
    this.set({ engine: "speech" });
    const voice = pickVoice(this.lang);
    const chunks = speechChunks(text);
    let next = 0;
    const speakNext = () => {
      if (token !== this.token) return;
      if (next >= chunks.length) return done();
      const utterance = new SpeechSynthesisUtterance(chunks[next++]);
      utterance.lang = this.lang;
      if (voice) utterance.voice = voice;
      utterance.rate = this.rate;
      utterance.onend = speakNext;
      utterance.onerror = (event) => {
        if (event.error !== "interrupted" && event.error !== "canceled")
          speakNext();
      };
      synth.speak(utterance);
    };
    speakNext();
  }

  toggle() {
    const { status, engine } = this.state;
    if (status === "idle") return this.play(0, "page");
    if (status === "playing") {
      if (engine === "audio") this.audio?.pause();
      else window.speechSynthesis?.pause();
      this.set({ status: "paused" });
    } else {
      if (engine === "audio") void this.audio?.play();
      else window.speechSynthesis?.resume();
      this.set({ status: "playing" });
    }
  }

  /** Turns read-aloud on (reading from the top when `start`) or off, and remembers it. */
  setEnabled(enabled: boolean, start: boolean) {
    this.set({ enabled });
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Not remembered; nothing else depends on it.
    }
    if (!enabled) this.stop();
    else if (start) this.play(0, "page");
  }

  /** Restores the visitor's last choice without starting to read. */
  restore() {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "on")
        this.set({ enabled: true });
    } catch {
      // Storage can be blocked; read-aloud simply starts off.
    }
  }

  setRate(rate: number) {
    this.rate = rate;
    if (this.audio) this.audio.playbackRate = rate;
  }

  /** Stops whatever is playing without changing the visible state. */
  private halt() {
    this.token += 1;
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  stop() {
    this.halt();
    this.set({ status: "idle", engine: null });
  }
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const base = lang.slice(0, 2);
  return (
    voices.find((voice) => voice.lang === lang) ??
    voices.find((voice) => voice.lang.replace("_", "-").startsWith(base))
  );
}

type ReadAloudContext = {
  reader: Reader;
  state: ReaderState;
  items: readonly ReadItem[];
};

const Context = createContext<ReadAloudContext | null>(null);

function useReadAloud() {
  const context = use(Context);
  if (!context) throw new Error("Read-aloud controls need a ReadAloudProvider");
  return context;
}

/**
 * Read-aloud for a Knowledge article (ADR-018): the header toggle turns it on and starts
 * reading the whole page; each section heading then gets its own play button, and a bar
 * at the bottom of the screen controls playback. Whether it is on is remembered per
 * visitor, but reading only ever starts on a press.
 */
export function ReadAloudProvider({
  items,
  locale,
  children,
}: {
  items: readonly ReadItem[];
  locale: Locale;
  children: React.ReactNode;
}) {
  const [reader] = useState(
    () => new Reader(items, locale === "vi" ? "vi-VN" : "en-US"),
  );
  const state = useSyncExternalStore(
    reader.subscribe,
    reader.getState,
    () => IDLE,
  );

  useEffect(() => {
    reader.restore();
    return () => reader.stop();
  }, [reader]);

  // The section being read is highlighted in the page.
  const currentId = state.current === null ? null : items[state.current]?.id;
  const active = state.status !== "idle";
  useEffect(() => {
    if (!currentId || !active) return;
    const element = document.getElementById(currentId);
    element?.setAttribute("data-reading", "");
    return () => element?.removeAttribute("data-reading");
  }, [currentId, active]);

  return (
    <Context value={{ reader, state, items }}>
      {children}
      {state.enabled ? (
        <>
          <div aria-hidden className="h-28" />
          <ReadAloudBar />
        </>
      ) : null}
    </Context>
  );
}

/** The header switch that turns read-aloud on (and starts reading) or off. */
export function ReadAloudToggle() {
  const t = useTranslations("Knowledge.readAloud");
  const { reader, state } = useReadAloud();
  const { enabled } = state;
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={() => reader.setEnabled(!enabled, !enabled)}
      className={cn(
        "inline-flex min-h-10 w-fit items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        enabled
          ? "border-[var(--era)] bg-[var(--era)]/10 text-foreground"
          : "border-border bg-surface text-foreground hover:bg-surface-muted",
      )}
    >
      <Headphones aria-hidden className="size-4" />
      {t("toggle")}
    </button>
  );
}

/** Play or stop one section; shown next to its heading while read-aloud is on. */
export function SectionReadButton({ id }: { id: string }) {
  const t = useTranslations("Knowledge.readAloud");
  const { reader, state, items } = useReadAloud();
  if (!state.enabled) return null;
  const index = items.findIndex((item) => item.id === id);
  const item = items[index];
  if (!item) return null;
  const reading = state.current === index && state.status !== "idle";
  return (
    <button
      type="button"
      onClick={() => (reading ? reader.stop() : reader.play(index, "section"))}
      aria-label={
        reading
          ? t("stopSection", { title: item.title })
          : t("readSection", { title: item.title })
      }
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors",
        reading
          ? "border-[var(--era)] bg-[var(--era)]/10"
          : "border-border bg-surface hover:bg-surface-muted",
      )}
    >
      {reading ? (
        <Square aria-hidden className="size-4" />
      ) : (
        <Volume2 aria-hidden className="size-4" />
      )}
    </button>
  );
}

function ReadAloudBar() {
  const t = useTranslations("Knowledge.readAloud");
  const { reader, state, items } = useReadAloud();
  const [rate, setRate] = useState(1);
  const noSpeech = useSyncExternalStore(
    subscribeVoices,
    () => !window.speechSynthesis,
    () => false,
  );
  const index = state.current ?? 0;
  const item = items[index];
  const position = {
    current: index + 1,
    total: items.length,
    title: item?.title ?? "",
  };
  const message =
    state.status === "playing"
      ? t("reading", position)
      : state.status === "paused"
        ? t("paused", position)
        : t("idle");
  const voice = item?.audio
    ? t("voiceRecorded", { voice: item.audio.voice })
    : noSpeech
      ? t("unsupported")
      : t("voiceBrowser");

  return (
    <section
      aria-label={t("player")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-1">
          <IconButton
            label={t("previous")}
            disabled={index === 0 && state.status === "idle"}
            onClick={() => reader.play(Math.max(0, index - 1), "page")}
          >
            <SkipBack aria-hidden className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => reader.toggle()}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            {state.status === "playing" ? (
              <Pause aria-hidden className="size-4" />
            ) : (
              <Play aria-hidden className="size-4" />
            )}
            {state.status === "playing"
              ? t("pause")
              : state.status === "paused"
                ? t("resume")
                : t("playPage")}
          </button>
          <IconButton
            label={t("next")}
            disabled={index + 1 >= items.length}
            onClick={() => reader.play(index + 1, "page")}
          >
            <SkipForward aria-hidden className="size-4" />
          </IconButton>
        </div>
        <div className="flex min-w-0 flex-1 basis-48 flex-col">
          <p aria-live="polite" className="truncate text-sm font-medium">
            {message}
          </p>
          <p className="truncate text-xs text-muted-foreground">{voice}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("speed")}
          <select
            value={rate}
            onChange={(event) => {
              const next = Number(event.target.value);
              setRate(next);
              reader.setRate(next);
            }}
            className="min-h-10 rounded-md border border-border bg-surface px-2 text-foreground"
          >
            {RATES.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
        <IconButton
          label={t("close")}
          onClick={() => reader.setEnabled(false, false)}
        >
          <X aria-hidden className="size-4" />
        </IconButton>
      </div>
    </section>
  );
}

function subscribeVoices(callback: () => void) {
  const synth = window.speechSynthesis;
  synth?.addEventListener("voiceschanged", callback);
  return () => synth?.removeEventListener("voiceschanged", callback);
}

function IconButton({
  label,
  children,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-full text-foreground hover:bg-surface-muted disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}
