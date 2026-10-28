import type { Metadata } from "next";
import { useMessages, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import {
  RoadmapTimeline,
  type TimelineEra,
} from "@/components/roadmap/roadmap-timeline";
import { VisionPipeline } from "@/components/roadmap/vision-pipeline";
import type { Locale } from "@/i18n/routing";
import {
  ERAS,
  MILESTONE_ILLUSTRATIONS,
  MILESTONES,
  milestonesByEra,
} from "@/lib/roadmap";

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
      major: milestone.major ?? false,
      title: copy.milestones[milestone.id].title,
      summary: copy.milestones[milestone.id].summary,
      impact: copy.milestones[milestone.id].impact,
      source: milestone.source,
      illustration: {
        id: MILESTONE_ILLUSTRATIONS[milestone.id],
        ...copy.illustrations[MILESTONE_ILLUSTRATIONS[milestone.id]],
      },
    })),
  }));

  // Topics in the order the messages list them, skipping any without a milestone yet.
  const topics = (Object.keys(copy.topics) as (keyof typeof copy.topics)[])
    .filter((topic) =>
      MILESTONES.some((milestone) => milestone.topic === topic),
    )
    .map((topic) => ({ id: topic, label: copy.topics[topic] }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t("title")}
        </h1>
      </header>

      <VisionPipeline label={t("hero.label")} stepLabels={copy.hero.steps} />

      <RoadmapTimeline
        eras={eras}
        topics={topics}
        labels={{
          jump: t("jumpLabel"),
          timeline: t("timelineLabel"),
          current: t("currentEra"),
          impact: t("detail.impact"),
          major: t("detail.major"),
          source: t("detail.source"),
          noSource: t("detail.noSource"),
          illustrationTitle: t("illustration.title"),
          illustrationShow: t("illustration.show"),
          illustrationHide: t("illustration.hide"),
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
