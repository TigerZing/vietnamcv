import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { useMessages, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { IllustrationPlayer } from "@/components/roadmap/illustration-player";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { TOPICS } from "@/lib/knowledge";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/knowledge">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Knowledge",
  });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: `/${locale}/knowledge` },
  };
}

/** Static: every topic and its copy ship with the build. */
export default function Page() {
  const t = useTranslations("Knowledge");
  const copy = useMessages().Knowledge;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("lead")}</p>
      </header>
      <ul aria-label={t("topicsLabel")} className="grid gap-6 md:grid-cols-2">
        {TOPICS.map((topic) => (
          <li key={topic.id} className="flex">
            <Link
              href={topic.href}
              className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-[var(--era)]"
              style={{ "--era": topic.hue } as React.CSSProperties}
            >
              <div className="border-b border-border bg-surface-muted p-4">
                <IllustrationPlayer
                  id={topic.cover}
                  className="mx-auto max-w-xs"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  {copy.topics[topic.id].name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {copy.topics[topic.id].summary}
                </p>
                <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("sectionCount", {
                      count: Object.keys(copy[topic.id].sections).length,
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-accent">
                    {t("read")}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
