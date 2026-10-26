"use client";

import { useEffect, useId, useState } from "react";

import type { IllustrationId } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

import { ILLUSTRATIONS } from "./illustrations";
import { VIEW } from "./illustrations/kit";

/**
 * Plays one roadmap illustration in a loop. Readers who ask for reduced motion get the
 * illustration's most telling still frame instead. Purely visual: the caption next to it
 * carries the explanation for screen readers.
 */
export function IllustrationPlayer({
  id,
  className,
}: {
  id: IllustrationId;
  className?: string;
}) {
  const illustration = ILLUSTRATIONS[id];
  const uid = `ill${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const phase = usePhase(
    illustration.duration ?? 4000,
    illustration.still ?? 0.75,
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      aria-hidden
      className={cn("h-auto w-full text-[var(--era)]", className)}
    >
      {illustration.render(phase, uid)}
    </svg>
  );
}

function usePhase(duration: number, still: number): number {
  const [phase, setPhase] = useState(still);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // The frame timestamp can precede `start` by a few milliseconds, so stay non-negative.
      setPhase((Math.max(0, now - start) % duration) / duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return phase;
}
