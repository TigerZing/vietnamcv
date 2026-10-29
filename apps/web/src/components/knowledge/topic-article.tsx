import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";

import { IllustrationPlayer } from "@/components/roadmap/illustration-player";
import { Link } from "@/i18n/navigation";
import {
  bodyBlocks,
  nextTopic,
  REFERENCES,
  TOPICS,
  type TopicId,
} from "@/lib/knowledge";
import type { IllustrationId } from "@/lib/roadmap";

export type ArticleSection = {
  id: string;
  title: string;
  body: string;
  formula?: string;
  illustration?: IllustrationId;
  /** Extra ids that should land on this section, e.g. links from an embedded tool. */
  anchors?: readonly string[];
};

/**
 * One knowledge topic: breadcrumb, lead, the topic's interactive piece (`children`), then
 * the sections with a contents list, the sources and a link to the next topic.
 */
export function TopicArticle({
  topic,
  sections,
  children,
}: {
  topic: TopicId;
  sections: readonly ArticleSection[];
  children: React.ReactNode;
}) {
  const t = useTranslations("Knowledge");
  const messages = useMessages();
  const copy = messages.Knowledge;
  const illustrations = messages.Roadmap.illustrations;
  const hue = TOPICS.find((entry) => entry.id === topic)?.hue;
  const next = nextTopic(topic);

  return (
    <article
      className="flex flex-col gap-8"
      style={{ "--era": hue } as React.CSSProperties}
    >
      <header className="flex flex-col gap-3">
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link href="/knowledge" className="hover:text-foreground">
                {t("title")}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="text-foreground">
              {copy.topics[topic].short}
            </li>
          </ol>
        </nav>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {copy.topics[topic].name}
        </h1>
        <p className="max-w-prose text-muted-foreground">
          {copy.topics[topic].lead}
        </p>
      </header>

      {children}

      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-labelledby={`${topic}-contents`}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <h2
            id={`${topic}-contents`}
            className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {t("contents")}
          </h2>
          <ol className="mt-3 flex flex-col gap-1 border-l border-border text-sm">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px flex gap-2 border-l-2 border-transparent py-1 pl-3 text-muted-foreground hover:border-[var(--era)] hover:text-foreground"
                >
                  <span className="tabular-nums" aria-hidden>
                    {index + 1}.
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-10">
          {sections.map((section, index) => (
            <TopicSection
              key={section.id}
              section={section}
              number={index + 1}
              illustration={
                section.illustration
                  ? {
                      id: section.illustration,
                      label: t("illustrationLabel", {
                        name: illustrations[section.illustration].name,
                      }),
                      caption: illustrations[section.illustration].caption,
                    }
                  : undefined
              }
            />
          ))}

          <section
            aria-labelledby={`${topic}-references`}
            className="flex flex-col gap-3 border-t border-border pt-8"
          >
            <h2
              id={`${topic}-references`}
              className="text-xl font-semibold tracking-tight"
            >
              {t("references")}
            </h2>
            <p className="max-w-prose text-sm text-muted-foreground">
              {t("referencesLead")}
            </p>
            <ul className="flex flex-col gap-3">
              {REFERENCES[topic].map((reference) => (
                <li key={reference.url} className="text-sm">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 font-medium text-accent hover:underline"
                  >
                    {reference.title}
                    <ExternalLink
                      aria-hidden
                      className="mt-0.5 size-3.5 shrink-0"
                    />
                  </a>
                  <span className="block text-muted-foreground">
                    {reference.authors} · {reference.year}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <aside
            aria-labelledby={`${topic}-note`}
            className="rounded-xl border border-dashed border-border bg-surface p-5"
          >
            <h2 id={`${topic}-note`} className="text-base font-semibold">
              {t("note.title")}
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {t("note.body")}
            </p>
          </aside>

          <Link
            href={next.href}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 hover:border-[var(--era)]"
          >
            <span className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                {t("otherTopic")}
              </span>
              <span className="font-semibold">{copy.topics[next.id].name}</span>
            </span>
            <ArrowRight
              aria-hidden
              className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function TopicSection({
  section,
  number,
  illustration,
}: {
  section: ArticleSection;
  number: number;
  illustration?: { id: IllustrationId; label: string; caption: string };
}) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="relative flex scroll-mt-24 flex-col gap-4"
    >
      {section.anchors?.map((anchor) => (
        <span
          key={anchor}
          id={anchor}
          aria-hidden
          className="absolute top-0 scroll-mt-24"
        />
      ))}
      <h2
        id={`${section.id}-title`}
        className="flex items-baseline gap-3 text-xl font-semibold tracking-tight sm:text-2xl"
      >
        <span aria-hidden className="text-[var(--era)] tabular-nums">
          {number}.
        </span>
        {section.title}
      </h2>
      <div
        className={
          illustration
            ? "grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_16rem]"
            : "min-w-0"
        }
      >
        <div className="flex max-w-prose min-w-0 flex-col gap-4 leading-7">
          {bodyBlocks(section.body).map((block, index) =>
            block.kind === "list" ? (
              <ul key={index} className="flex list-disc flex-col gap-2 pl-5">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p key={index}>{block.text}</p>
            ),
          )}
          {section.formula ? (
            <p className="rounded-lg border border-border bg-surface-muted px-4 py-3 font-mono text-sm break-words">
              {section.formula}
            </p>
          ) : null}
        </div>
        {illustration ? (
          <figure
            aria-label={illustration.label}
            className="flex flex-col gap-2 self-start rounded-xl border border-border bg-surface p-3"
          >
            <IllustrationPlayer id={illustration.id} />
            <figcaption className="text-xs leading-5 text-muted-foreground">
              {illustration.caption}
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
