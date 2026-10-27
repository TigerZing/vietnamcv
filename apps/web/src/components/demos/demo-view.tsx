import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CommentSection } from "@/components/comments/comment-section";
import { LoadingState } from "@/components/states/loading-state";
import type { Locale } from "@/i18n/routing";
import {
  type Demo,
  demoPostUrl,
  demoPublishedAt,
  demoThread,
} from "@/lib/demos";

import { DemoPlayer } from "./demo-player";

type Query = Promise<Record<string, string | string[] | undefined>>;

/** The right column: player, the product's description, credits, source and comments. */
export async function DemoView({
  demo,
  locale,
  path,
  autoplay,
  searchParams,
}: {
  demo: Demo;
  locale: Locale;
  /** The page this demo is shown on, e.g. `/vi/demos/03`. */
  path: string;
  autoplay: boolean;
  searchParams: Query;
}) {
  const t = await getTranslations({ locale, namespace: "Demos" });
  const comments = await getTranslations({ locale, namespace: "Comments" });
  const loading = await getTranslations({ locale, namespace: "Loading" });
  const format = await getFormatter({ locale });
  const title = demo.title[locale];
  const published = demoPublishedAt(demo);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <DemoPlayer demo={demo} title={title} autoplay={autoplay} />

      <article className="flex flex-col gap-4" aria-labelledby="demo-title">
        <h2
          id="demo-title"
          className="text-xl leading-snug font-semibold text-balance sm:text-2xl"
        >
          {title}
        </h2>

        <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-surface-muted px-4 py-3 text-sm">
          {demo.maker ? (
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">{t("madeBy")}:</dt>
              <dd className="font-medium">{demo.maker}</dd>
            </div>
          ) : null}
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{t("postedBy")}:</dt>
            <dd className="font-medium">
              {demo.author}
              <span aria-hidden> · </span>
              <time
                dateTime={published.toISOString()}
                className="font-normal text-muted-foreground"
              >
                {format.dateTime(published, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{t("source")}:</dt>
            <dd>
              <a
                href={demoPostUrl(demo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {t("viewOnLinkedIn")}
                <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">{t("opensNewTab")}</span>
              </a>
            </dd>
          </div>
        </dl>

        <section aria-labelledby="demo-about" className="flex flex-col gap-2">
          <h3 id="demo-about" className="text-base font-semibold">
            {t("about")}
          </h3>
          <p className="max-w-prose leading-relaxed">
            {demo.description[locale]}
          </p>
          <p className="text-xs text-muted-foreground">{t("aboutNote")}</p>
        </section>
      </article>

      <section
        id="comments"
        aria-labelledby="comments-heading"
        className="flex scroll-mt-20 flex-col gap-4 border-t border-border pt-6"
      >
        <h2 id="comments-heading" className="text-xl font-semibold">
          {comments("title")}
        </h2>
        <Suspense fallback={<LoadingState label={loading("label")} rows={2} />}>
          <DemoComments
            demo={demo}
            locale={locale}
            path={path}
            searchParams={searchParams}
          />
        </Suspense>
      </section>
    </div>
  );
}

async function DemoComments({
  demo,
  locale,
  path,
  searchParams,
}: {
  demo: Demo;
  locale: Locale;
  path: string;
  searchParams: Query;
}) {
  await connection();
  const query = await searchParams;
  return (
    <CommentSection
      thread={demoThread(demo)}
      path={path}
      locale={locale}
      cursor={typeof query.c === "string" ? query.c : undefined}
      signIn={typeof query.signin === "string" ? query.signin : undefined}
    />
  );
}
