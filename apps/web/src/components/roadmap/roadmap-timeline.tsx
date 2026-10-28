"use client";

import {
  ArrowUpRight,
  Box,
  ChevronDown,
  Database,
  Film,
  Layers,
  Lightbulb,
  MessagesSquare,
  Play,
  ScanFace,
  ScanLine,
  ScanSearch,
  Shapes,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { EraId, IllustrationId, MilestoneTopic } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

import { IllustrationPlayer } from "./illustration-player";

export type TimelineMilestone = {
  id: string;
  year: number;
  topic: MilestoneTopic;
  topicLabel: string;
  /** Shown by default; the rest appear only under "all milestones". */
  major: boolean;
  title: string;
  summary: string;
  impact: string;
  source?: string;
  illustration: {
    id: IllustrationId;
    name: string;
    caption: string;
  };
};

export type TimelineEra = {
  id: EraId;
  name: string;
  period: string;
  blurb: string;
  milestones: readonly TimelineMilestone[];
};

export type TimelineLabels = {
  jump: string;
  timeline: string;
  current: string;
  impact: string;
  major: string;
  source: string;
  noSource: string;
  illustrationTitle: string;
  illustrationShow: string;
  illustrationHide: string;
};

export type TimelineTopic = { id: MilestoneTopic; label: string };

/** Whether the timeline shows only the major milestones or every one of them. */
type Scope = "major" | "all";

const TOPIC_ICONS: Record<MilestoneTopic, typeof Lightbulb> = {
  foundations: Lightbulb,
  processing: ScanLine,
  recognition: Tags,
  detection: ScanSearch,
  segmentation: Shapes,
  geometry: Box,
  motion: Film,
  people: ScanFace,
  generation: Sparkles,
  multimodal: MessagesSquare,
  data: Database,
};

/** Every era carries its own hue; the CSS variables are declared in `globals.css`. */
function eraStyle(era: EraId): React.CSSProperties {
  return { ["--era" as string]: `var(--era-${era})` };
}

export function RoadmapTimeline({
  eras,
  topics,
  labels,
}: {
  eras: readonly TimelineEra[];
  topics: readonly TimelineTopic[];
  labels: TimelineLabels;
}) {
  const t = useTranslations("Roadmap");
  const [scope, setScope] = useState<Scope>("major");
  const [topic, setTopic] = useState<MilestoneTopic | null>(null);
  const currentEra = useCurrentEra(eras);
  const visibleEras = useMemo(
    () =>
      eras.map((era) => ({
        ...era,
        milestones: era.milestones.filter(
          (milestone) =>
            (scope === "all" || milestone.major) &&
            (topic === null || milestone.topic === topic),
        ),
      })),
    [eras, scope, topic],
  );
  const counts = useMemo(() => {
    const all = eras.flatMap((era) => era.milestones);
    return {
      major: all.filter((milestone) => milestone.major).length,
      all: all.length,
    };
  }, [eras]);
  const visibleCount = visibleEras.reduce(
    (total, era) => total + era.milestones.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <ScopeToggle selected={scope} onSelect={setScope} counts={counts} />
        <TopicFilter topics={topics} selected={topic} onSelect={setTopic} />
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground sm:ml-auto"
        >
          {t("filter.showing", { count: visibleCount })}
        </p>
      </div>
      <EraJumpBar eras={eras} currentEra={currentEra} labels={labels} />
      <ol aria-label={labels.timeline} className="flex flex-col gap-12">
        {visibleEras.map((era, index) => (
          <li key={era.id} id={eraSectionId(era.id)} className="scroll-mt-32">
            <EraSection
              era={era}
              index={index}
              countLabel={t("milestoneCount", { count: era.milestones.length })}
              emptyLabel={t("filter.empty")}
              labels={labels}
              showMajorBadge={scope === "all"}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Major milestones only (the default) or the full timeline. */
function ScopeToggle({
  selected,
  onSelect,
  counts,
}: {
  selected: Scope;
  onSelect: (scope: Scope) => void;
  counts: Record<Scope, number>;
}) {
  const t = useTranslations("Roadmap.filter.scope");
  const scopes: { id: Scope; icon: typeof Star }[] = [
    { id: "major", icon: Star },
    { id: "all", icon: Layers },
  ];

  return (
    <section aria-labelledby="roadmap-scope-label">
      <h2 id="roadmap-scope-label" className="sr-only">
        {t("label")}
      </h2>
      <ul className="inline-flex rounded-full border border-border bg-surface p-1">
        {scopes.map(({ id, icon: Icon }) => {
          const pressed = selected === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => onSelect(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm tabular-nums transition-colors",
                  pressed
                    ? "bg-accent-soft font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {t(id, { count: counts[id] })}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Narrows the timeline to one topic, or shows every topic. */
function TopicFilter({
  topics,
  selected,
  onSelect,
}: {
  topics: readonly TimelineTopic[];
  selected: MilestoneTopic | null;
  onSelect: (topic: MilestoneTopic | null) => void;
}) {
  const t = useTranslations("Roadmap.filter");
  const Icon = selected ? TOPIC_ICONS[selected] : Layers;

  return (
    <label className="relative inline-flex items-center gap-2 text-sm">
      <span className="font-medium">{t("label")}</span>
      <span className="relative inline-flex items-center">
        <Icon
          aria-hidden
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        />
        <select
          value={selected ?? ""}
          onChange={(event) =>
            onSelect((event.target.value || null) as MilestoneTopic | null)
          }
          className={cn(
            "appearance-none rounded-full border bg-surface py-1.5 pr-8 pl-9 text-sm transition-colors hover:bg-surface-muted",
            selected ? "border-accent bg-accent-soft" : "border-border",
          )}
        >
          <option value="">{t("all")}</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 size-4 text-muted-foreground"
        />
      </span>
    </label>
  );
}

function eraSectionId(era: EraId): string {
  return `era-${era}`;
}

/**
 * Highlights the era the reader has reached. Pure decoration: the bar works as plain
 * anchor links without JavaScript, and the highlight is only ever additional information.
 */
function useCurrentEra(eras: readonly TimelineEra[]): EraId | null {
  const [currentEra, setCurrentEra] = useState<EraId | null>(null);

  useEffect(() => {
    const sections = eras
      .map((era) => document.getElementById(eraSectionId(era.id)))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setCurrentEra(visible[0].target.id.replace("era-", "") as EraId);
        }
      },
      // Only the band just below the sticky header counts as "where the reader is".
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [eras]);

  return currentEra;
}

function EraJumpBar({
  eras,
  currentEra,
  labels,
}: {
  eras: readonly TimelineEra[];
  currentEra: EraId | null;
  labels: TimelineLabels;
}) {
  return (
    <nav
      aria-label={labels.jump}
      className="sticky top-16 z-30 -mx-4 border-y border-border bg-surface/95 px-4 py-1.5 backdrop-blur"
    >
      <ul className="relative flex snap-x gap-1.5 overflow-x-auto">
        {eras.map((era) => {
          const active = era.id === currentEra;
          return (
            <li key={era.id} className="snap-start">
              <a
                href={`#${eraSectionId(era.id)}`}
                title={era.name}
                style={eraStyle(era.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap tabular-nums transition-colors",
                  active
                    ? "border-[var(--era)] bg-surface-muted text-foreground"
                    : "border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full bg-[var(--era)]"
                />
                {/* Only the years are shown to keep the bar on one line; the name is still
                    the link's accessible name and its tooltip. */}
                <span className="sr-only">{era.name}</span>
                <span className="font-medium">{era.period}</span>
                {active ? (
                  <span className="sr-only">{labels.current}</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EraSection({
  era,
  index,
  countLabel,
  emptyLabel,
  labels,
  showMajorBadge,
}: {
  era: TimelineEra;
  index: number;
  countLabel: string;
  emptyLabel: string;
  labels: TimelineLabels;
  showMajorBadge: boolean;
}) {
  return (
    <section aria-labelledby={`${eraSectionId(era.id)}-heading`}>
      <header style={eraStyle(era.id)} className="relative">
        <div className="flex items-baseline gap-3">
          <span
            aria-hidden
            className="text-4xl leading-none font-bold text-[var(--era)] tabular-nums sm:text-5xl"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-1">
            <h3
              id={`${eraSectionId(era.id)}-heading`}
              className="text-xl font-semibold tracking-tight sm:text-2xl"
            >
              {era.name}
            </h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-[var(--era)] tabular-nums">
                {era.period}
              </span>
              <span>{countLabel}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-prose text-muted-foreground">{era.blurb}</p>
        <div
          aria-hidden
          className="mt-4 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(to right, var(--era), var(--border) 40%, transparent)",
          }}
        />
      </header>

      {era.milestones.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : null}
      <ol
        style={eraStyle(era.id)}
        hidden={era.milestones.length === 0}
        className="relative mt-6 flex flex-col gap-4 lg:gap-0"
      >
        <span
          aria-hidden
          className="absolute top-0 bottom-0 left-[0.4375rem] w-0.5 rounded-full lg:left-[calc(50%-1px)]"
          style={{
            background:
              "linear-gradient(to bottom, var(--era), var(--border) 45%, transparent)",
          }}
        />
        {era.milestones.map((milestone, position) => (
          <MilestoneRow
            key={milestone.id}
            milestone={milestone}
            alignEnd={position % 2 === 1}
            labels={labels}
            showMajorBadge={showMajorBadge}
          />
        ))}
      </ol>
    </section>
  );
}

/** The `lg` breakpoint, where the timeline splits into two columns around the spine. */
const WIDE_QUERY = "(min-width: 64rem)";

function useWideLayout(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(WIDE_QUERY);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
}

/**
 * One milestone on the spine. On wide screens, hovering or focusing the card opens an
 * animated "how it works" panel in the empty column on the other side of the spine; the
 * button pins it open, which is also how it opens on narrow screens (below the card).
 * Escape closes it, and the pointer can move onto the panel without it disappearing.
 */
function MilestoneRow({
  milestone,
  alignEnd,
  labels,
  showMajorBadge,
}: {
  milestone: TimelineMilestone;
  alignEnd: boolean;
  labels: TimelineLabels;
  showMajorBadge: boolean;
}) {
  const wide = useWideLayout();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();
  const open = pinned || (wide && (hovered || focused));

  const close = useCallback(() => {
    setHovered(false);
    setFocused(false);
    setPinned(false);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Touch "hover" would flash the panel on every tap, so only a mouse opens it this way.
  const hoverHandlers = {
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(closeTimer.current);
      setHovered(true);
    },
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      closeTimer.current = window.setTimeout(() => setHovered(false), 150);
    },
  };

  return (
    <li className="group grid grid-cols-[1.25rem_1fr] gap-x-3 lg:grid-cols-[1fr_3rem_1fr] lg:gap-x-0 lg:pb-4">
      <span
        aria-hidden
        className="relative z-10 row-start-1 mt-5 flex size-4 items-center justify-center rounded-full border-2 border-[var(--era)] bg-background transition-transform duration-200 group-focus-within:scale-125 group-hover:scale-125 lg:col-start-2 lg:justify-self-center"
      >
        <span className="size-1.5 rounded-full bg-[var(--era)]" />
      </span>
      <div
        {...hoverHandlers}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
          }
        }}
        className={cn(
          "col-start-2 row-start-1",
          alignEnd ? "lg:col-start-3 lg:pl-6" : "lg:col-start-1 lg:pr-6",
        )}
      >
        <MilestoneCard
          milestone={milestone}
          labels={labels}
          showMajorBadge={showMajorBadge}
          illustration={{
            panelId,
            open,
            pinned,
            // Unpinning also drops hover and focus, so the panel really goes away.
            onToggle: () => (pinned ? close() : setPinned(true)),
          }}
        />
      </div>
      {open ? (
        <div
          className={cn(
            "col-start-2 row-start-2 lg:relative lg:row-start-1",
            alignEnd ? "lg:col-start-1" : "lg:col-start-3",
          )}
        >
          <IllustrationPanel
            id={panelId}
            milestone={milestone}
            title={labels.illustrationTitle}
            side={alignEnd ? "start" : "end"}
            {...hoverHandlers}
          />
        </div>
      ) : null}
    </li>
  );
}

/**
 * The animated explanation. Below `lg` it sits under the card; from `lg` up it floats in
 * the column opposite the card, pointing back at the spine, without changing the layout.
 */
function IllustrationPanel({
  id,
  milestone,
  title,
  side,
  onPointerEnter,
  onPointerLeave,
}: {
  id: string;
  milestone: TimelineMilestone;
  title: string;
  /** Which column the panel sits in on wide screens. */
  side: "start" | "end";
  onPointerEnter: (event: React.PointerEvent) => void;
  onPointerLeave: (event: React.PointerEvent) => void;
}) {
  return (
    <div
      id={id}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={cn(
        "relative mt-3 animate-[roadmap-pop_180ms_ease-out] rounded-xl border border-[var(--era)] bg-surface p-3 shadow-lg lg:absolute lg:top-0 lg:z-20 lg:mt-0 lg:w-[calc(100%-1.5rem)] lg:max-w-sm",
        side === "end" ? "lg:left-6" : "lg:right-6",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-6 hidden size-3 rotate-45 border-[var(--era)] bg-surface lg:block",
          side === "end"
            ? "-left-[7px] border-b border-l"
            : "-right-[7px] border-t border-r",
        )}
      />
      <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
        <span className="font-semibold tracking-wide text-[var(--era)] uppercase">
          {title}
        </span>
        <span className="font-medium text-foreground">
          {milestone.illustration.name}
        </span>
      </p>
      <div className="mt-2 overflow-hidden rounded-lg bg-background">
        <IllustrationPlayer id={milestone.illustration.id} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {milestone.illustration.caption}
      </p>
    </div>
  );
}

function MilestoneCard({
  milestone,
  labels,
  showMajorBadge,
  illustration,
}: {
  milestone: TimelineMilestone;
  labels: TimelineLabels;
  /** In the full timeline, mark the major milestones so they stand out. */
  showMajorBadge: boolean;
  illustration: {
    panelId: string;
    open: boolean;
    pinned: boolean;
    onToggle: () => void;
  };
}) {
  const TopicIcon = TOPIC_ICONS[milestone.topic];

  return (
    <article className="rounded-xl border border-border bg-surface p-4 transition-colors group-hover:border-[var(--era)] sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-lg font-bold text-[var(--era)] tabular-nums">
          {milestone.year}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
          <TopicIcon aria-hidden className="size-3.5" />
          {milestone.topicLabel}
        </span>
        {showMajorBadge && milestone.major ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--era)] px-2 py-0.5 text-xs font-medium">
            <Star
              aria-hidden
              className="size-3.5 fill-[var(--era)] text-[var(--era)]"
            />
            {labels.major}
          </span>
        ) : null}
      </div>
      <h4 className="mt-2 text-base font-semibold tracking-tight text-balance">
        {milestone.title}
      </h4>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {milestone.summary}
      </p>
      <p
        className="mt-3 border-l-2 pl-3 text-sm"
        style={{ borderColor: "var(--era)" }}
      >
        <span className="font-medium">{labels.impact}: </span>
        {milestone.impact}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {milestone.source ? (
          <a
            href={milestone.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-sm text-accent hover:underline"
          >
            {labels.source}
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">{labels.noSource}</p>
        )}
        <button
          type="button"
          aria-expanded={illustration.open}
          aria-controls={illustration.panelId}
          onClick={illustration.onToggle}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--era)] hover:text-foreground"
        >
          <Play aria-hidden className="size-3.5" />
          {illustration.pinned
            ? labels.illustrationHide
            : labels.illustrationShow}
        </button>
      </div>
    </article>
  );
}
