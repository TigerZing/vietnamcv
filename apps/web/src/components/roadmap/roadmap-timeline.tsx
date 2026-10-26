"use client";

import {
  ArrowUpRight,
  Box,
  Database,
  Film,
  Layers,
  Lightbulb,
  MessagesSquare,
  ScanFace,
  ScanLine,
  ScanSearch,
  Shapes,
  Sparkles,
  Tags,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import type { EraId, MilestoneTopic } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

export type TimelineMilestone = {
  id: string;
  year: number;
  topic: MilestoneTopic;
  topicLabel: string;
  title: string;
  summary: string;
  impact: string;
  source?: string;
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
  source: string;
  noSource: string;
};

export type TimelineTopic = { id: MilestoneTopic; label: string };

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
  const [topic, setTopic] = useState<MilestoneTopic | null>(null);
  const currentEra = useCurrentEra(eras);
  const visibleEras = useMemo(
    () =>
      eras.map((era) => ({
        ...era,
        milestones: topic
          ? era.milestones.filter((milestone) => milestone.topic === topic)
          : era.milestones,
      })),
    [eras, topic],
  );
  const visibleCount = visibleEras.reduce(
    (total, era) => total + era.milestones.length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <TopicFilter
        topics={topics}
        selected={topic}
        onSelect={setTopic}
        status={t("filter.showing", { count: visibleCount })}
      />
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
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Narrows the timeline to one topic; a second press on the same chip clears it. */
function TopicFilter({
  topics,
  selected,
  onSelect,
  status,
}: {
  topics: readonly TimelineTopic[];
  selected: MilestoneTopic | null;
  onSelect: (topic: MilestoneTopic | null) => void;
  status: string;
}) {
  const t = useTranslations("Roadmap.filter");
  const chip =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors";
  const idle =
    "border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground";
  const active = "border-accent bg-accent-soft text-foreground";

  return (
    <section
      aria-labelledby="roadmap-filter-label"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="roadmap-filter-label" className="text-sm font-semibold">
          {t("label")}
        </h2>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {status}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            aria-pressed={selected === null}
            onClick={() => onSelect(null)}
            className={cn(chip, selected === null ? active : idle)}
          >
            <Layers aria-hidden className="size-4" />
            {t("all")}
          </button>
        </li>
        {topics.map((topic) => {
          const Icon = TOPIC_ICONS[topic.id];
          const pressed = selected === topic.id;
          return (
            <li key={topic.id}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => onSelect(pressed ? null : topic.id)}
                className={cn(chip, pressed ? active : idle)}
              >
                <Icon aria-hidden className="size-4" />
                {topic.label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
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
      className="sticky top-16 z-30 -mx-4 border-y border-border bg-surface/95 px-4 py-2 backdrop-blur"
    >
      <ul className="flex snap-x gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible">
        {eras.map((era) => {
          const active = era.id === currentEra;
          return (
            <li key={era.id} className="snap-start">
              <a
                href={`#${eraSectionId(era.id)}`}
                style={eraStyle(era.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-[var(--era)] bg-surface-muted text-foreground"
                    : "border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full bg-[var(--era)]"
                />
                <span className="font-medium">{era.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {era.period}
                </span>
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
}: {
  era: TimelineEra;
  index: number;
  countLabel: string;
  emptyLabel: string;
  labels: TimelineLabels;
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
          />
        ))}
      </ol>
    </section>
  );
}

function MilestoneRow({
  milestone,
  alignEnd,
  labels,
}: {
  milestone: TimelineMilestone;
  alignEnd: boolean;
  labels: TimelineLabels;
}) {
  return (
    <li className="group grid grid-cols-[1.25rem_1fr] gap-x-3 lg:grid-cols-[1fr_3rem_1fr] lg:gap-x-0 lg:pb-4">
      <span
        aria-hidden
        className="relative z-10 row-start-1 mt-5 flex size-4 items-center justify-center rounded-full border-2 border-[var(--era)] bg-background transition-transform duration-200 group-focus-within:scale-125 group-hover:scale-125 lg:col-start-2 lg:justify-self-center"
      >
        <span className="size-1.5 rounded-full bg-[var(--era)]" />
      </span>
      <div
        className={cn(
          "col-start-2 row-start-1",
          alignEnd ? "lg:col-start-3 lg:pl-6" : "lg:col-start-1 lg:pr-6",
        )}
      >
        <MilestoneCard milestone={milestone} labels={labels} />
      </div>
    </li>
  );
}

function MilestoneCard({
  milestone,
  labels,
}: {
  milestone: TimelineMilestone;
  labels: TimelineLabels;
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
      {milestone.source ? (
        <a
          href={milestone.source}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex w-fit items-center gap-1 text-sm text-accent hover:underline"
        >
          {labels.source}
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{labels.noSource}</p>
      )}
    </article>
  );
}
