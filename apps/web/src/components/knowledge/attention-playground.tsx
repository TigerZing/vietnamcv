"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import {
  attentionWeights,
  patchKind,
  patchPosition,
  toPercentages,
} from "@/lib/attention-toy";
import { cn } from "@/lib/utils";

/** The first cat patch: the most telling starting query. */
const DEFAULT_QUERY = 5;

/**
 * Pick a patch of a toy 4 × 4 image as the query and see the attention weights it gives
 * every patch (`lib/attention-toy.ts`). The grid is a set of toggle buttons; a live region
 * reads out where the query looks most.
 */
export function AttentionPlayground() {
  const t = useTranslations("Knowledge.transformer.playground");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [positionBias, setPositionBias] = useState(false);
  const switchId = useId();

  const percentages = toPercentages(attentionWeights(query, positionBias));
  const max = Math.max(...percentages);
  const top = percentages
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(({ weight, index }) =>
      t("topItem", { kind: t(`kinds.${patchKind(index)}`), weight }),
    )
    .join(", ");

  return (
    <section
      aria-labelledby="attention-playground-title"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="attention-playground-title"
          className="text-xl font-semibold tracking-tight"
        >
          {t("title")}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("body")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
        <div className="relative aspect-square w-full max-w-[22rem] overflow-hidden rounded-lg border border-border">
          <ToyImage />
          <div
            role="group"
            aria-label={t("gridLabel")}
            className="absolute inset-0 grid grid-cols-4 grid-rows-4"
          >
            {percentages.map((weight, index) => {
              const kind = patchKind(index);
              const selected = index === query;
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={selected}
                  aria-label={t("patchLabel", {
                    ...patchPosition(index),
                    kind: t(`kinds.${kind}`),
                    weight,
                  })}
                  onClick={() => setQuery(index)}
                  className={cn(
                    "relative flex items-end justify-end border border-white/40 p-1 outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-[var(--accent)]",
                    selected &&
                      "z-10 ring-4 ring-[var(--foreground)] ring-inset",
                  )}
                  style={{
                    backgroundColor: `color-mix(in oklch, var(--era) ${Math.round(
                      (weight / max) * 80,
                    )}%, transparent)`,
                  }}
                >
                  {selected ? (
                    <span className="absolute top-1 left-1 rounded bg-foreground px-1.5 text-[0.65rem] font-semibold text-background">
                      {t("queryLabel")}
                    </span>
                  ) : null}
                  <span className="rounded bg-background/85 px-1 text-xs font-semibold text-foreground tabular-nums">
                    {weight}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          <div className="flex items-start gap-3">
            <button
              id={switchId}
              type="button"
              role="switch"
              aria-checked={positionBias}
              onClick={() => setPositionBias((value) => !value)}
              className={cn(
                "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors focus-visible:ring-4 focus-visible:ring-[var(--accent)] focus-visible:outline-none",
                positionBias ? "bg-[var(--era)]" : "bg-surface-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-block size-4 rounded-full bg-background shadow transition-transform",
                  positionBias ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
            <label htmlFor={switchId} className="cursor-pointer">
              {t("positionToggle")}
            </label>
          </div>
          <p
            aria-live="polite"
            className="rounded-lg bg-surface-muted px-3 py-2 font-medium"
          >
            {t("summary", {
              kind: t(`kinds.${patchKind(query)}`),
              ...patchPosition(query),
              top,
            })}
          </p>
          <p className="max-w-prose text-muted-foreground">{t("explain")}</p>
          <p className="max-w-prose text-xs text-muted-foreground italic">
            {t("toy")}
          </p>
        </div>
      </div>
    </section>
  );
}

/** The toy scene, one unit per patch: sky with a sun, a cat, a tree, grass. */
function ToyImage() {
  return (
    <svg
      viewBox="0 0 4 4"
      aria-hidden
      className="absolute inset-0 size-full"
      preserveAspectRatio="none"
    >
      <rect width="4" height="1" fill="#9fd3f5" />
      <rect y="1" width="4" height="3" fill="#a6d672" />
      <rect y="3" width="4" height="1" fill="#7cb94a" />
      <circle cx="3.5" cy="0.5" r="0.32" fill="#ffd23f" />
      {/* Tree in the right column. */}
      <rect x="3.42" y="2.2" width="0.16" height="0.75" fill="#7a5230" />
      <circle cx="3.5" cy="1.75" r="0.55" fill="#3f8f3a" />
      {/* Cat over the four centre patches. */}
      <ellipse cx="2" cy="2.45" rx="0.8" ry="0.5" fill="#f08c3a" />
      <circle cx="1.55" cy="1.65" r="0.42" fill="#f08c3a" />
      <path d="M1.2 1.45 L1.25 1.05 L1.48 1.3 Z" fill="#f08c3a" />
      <path d="M1.9 1.45 L1.85 1.05 L1.62 1.3 Z" fill="#f08c3a" />
      <circle cx="1.42" cy="1.6" r="0.05" fill="#2b2b2b" />
      <circle cx="1.68" cy="1.6" r="0.05" fill="#2b2b2b" />
      <path
        d="M2.75 2.4 Q3.05 2.0 2.85 1.6"
        stroke="#f08c3a"
        strokeWidth="0.12"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
