import { ChevronRight } from "lucide-react";

/**
 * The thread running through the whole timeline: every era answers the same question with
 * better tools, moving an image from raw pixels to meaning. Each stage is a small inline
 * SVG so it stays sharp and follows the theme; the labels are real text, not SVG text, so
 * they wrap at 360px and are read by screen readers.
 */

type Stage = {
  key: "pixels" | "edges" | "features" | "meaning";
  era: "origins" | "classical" | "deep" | "generative";
  glyph: React.ReactNode;
};

const STAGES: readonly Stage[] = [
  {
    key: "pixels",
    era: "origins",
    glyph: (
      <>
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={6 + col * 9}
              y={6 + row * 9}
              width="8"
              height="8"
              rx="1"
              fill="currentColor"
              opacity={0.18 + ((row * 4 + col) % 5) * 0.18}
            />
          )),
        )}
      </>
    ),
  },
  {
    key: "edges",
    era: "classical",
    glyph: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M7 35 L20 11 L33 35" />
        <path d="M12 27 h16" opacity="0.55" />
        <circle cx="20" cy="11" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="7" cy="35" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="33" cy="35" r="2.5" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    key: "features",
    era: "deep",
    glyph: (
      <g>
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            x={5 + index * 7}
            y={8 + index * 5}
            width="22"
            height="22"
            rx="3"
            fill="currentColor"
            opacity={0.22 + index * 0.26}
          />
        ))}
        <path
          d="M14 30 h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    ),
  },
  {
    key: "meaning",
    era: "generative",
    glyph: (
      <g>
        <rect
          x="5"
          y="9"
          width="17"
          height="13"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="17"
          y="19"
          width="18"
          height="13"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M30 5 l1.6 4.4 L36 11 l-4.4 1.6 L30 17 l-1.6-4.4 L24 11 l4.4-1.6 Z"
          fill="currentColor"
        />
      </g>
    ),
  },
];

export function VisionPipeline({
  label,
  stepLabels,
}: {
  label: string;
  stepLabels: Record<Stage["key"], string>;
}) {
  return (
    <section
      aria-labelledby="vision-pipeline-label"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2
        id="vision-pipeline-label"
        className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
      >
        {label}
      </h2>
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:items-stretch sm:gap-2">
        {STAGES.map((stage, index) => (
          <li
            key={stage.key}
            className="flex items-center gap-2 sm:flex-1"
            style={{ ["--era" as string]: `var(--era-${stage.era})` }}
          >
            <div className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-surface-muted px-3 py-4 text-center">
              <svg
                viewBox="0 0 40 40"
                aria-hidden
                className="size-10 text-[var(--era)]"
              >
                {stage.glyph}
              </svg>
              <span className="text-sm font-medium text-balance">
                {stepLabels[stage.key]}
              </span>
            </div>
            {index < STAGES.length - 1 ? (
              <ChevronRight
                aria-hidden
                className="hidden size-4 shrink-0 text-muted-foreground sm:block"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
