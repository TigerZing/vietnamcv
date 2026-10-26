import type { Metadata } from "next";
import { useMessages, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import {
  RoadmapTimeline,
  type TimelineEra,
} from "@/components/roadmap/roadmap-timeline";
import { VisionPipeline } from "@/components/roadmap/vision-pipeline";
import type { Locale } from "@/i18n/routing";
import { ERAS, MILESTONES, milestonesByEra, timelineSpan } from "@/lib/roadmap";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/roadmap">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Roadmap",
  });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: `/${locale}/roadmap` },
  };
}

export default function Page() {
  const t = useTranslations("Roadmap");
  // The copy for each era and milestone is read from the message tree by id, so a new
  // milestone only needs a data entry plus its copy (the ids are typechecked in roadmap.ts).
  const copy = useMessages().Roadmap;
  const span = timelineSpan();

  const eras: TimelineEra[] = ERAS.map((era) => ({
    id: era.id,
    name: copy.eras[era.id].name,
    period: copy.eras[era.id].period,
    blurb: copy.eras[era.id].blurb,
    milestones: milestonesByEra(era.id).map((milestone) => ({
      id: milestone.id,
      year: milestone.year,
      topic: milestone.topic,
      topicLabel: copy.topics[milestone.topic],
      title: copy.milestones[milestone.id].title,
      summary: copy.milestones[milestone.id].summary,
      impact: copy.milestones[milestone.id].impact,
      source: milestone.source,
    })),
  }));

  // Topics in the order the messages list them, skipping any without a milestone yet.
  const topics = (Object.keys(copy.topics) as (keyof typeof copy.topics)[])
    .filter((topic) =>
      MILESTONES.some((milestone) => milestone.topic === topic),
    )
    .map((topic) => ({ id: topic, label: copy.topics[topic] }));

  const stats = [
    t("stats.span", { from: span.from, to: span.to }),
    t("stats.milestones", { count: MILESTONES.length }),
    t("stats.eras", { count: ERAS.length }),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
        <ul className="flex flex-wrap gap-2">
          {stats.map((stat) => (
            <li
              key={stat}
              className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground tabular-nums"
            >
              {stat}
            </li>
          ))}
        </ul>
      </header>

      <VisionPipeline label={t("hero.label")} stepLabels={copy.hero.steps} />

      <RoadmapTimeline
        eras={eras}
        topics={topics}
        labels={{
          jump: t("jumpLabel"),
          timeline: t("timelineLabel"),
          current: t("currentEra"),
          show: t("detail.show"),
          hide: t("detail.hide"),
          source: t("detail.source"),
          noSource: t("detail.noSource"),
        }}
      />

      <section
        aria-labelledby="roadmap-note"
        className="rounded-xl border border-dashed border-border bg-surface p-5"
      >
        <h2 id="roadmap-note" className="text-base font-semibold">
          {t("note.title")}
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {t("note.body")}
        </p>
      </section>
    </div>
  );
}
