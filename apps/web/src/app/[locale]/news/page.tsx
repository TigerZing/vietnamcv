import type { Metadata } from "next";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { FeedToolbar } from "@/components/news/feed-toolbar";
import { NewsCard } from "@/components/news/news-card";
import { NewsListItem } from "@/components/news/news-list-item";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listNews } from "@/lib/news";
import {
  gridClass,
  gridImageSizes,
  newsViewQuery,
  parseNewsView,
} from "@/lib/news-view";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "News",
  });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: `/${locale}/news` },
  };
}

async function NewsFeed({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/news">["searchParams"];
}) {
  await connection();
  const query = await searchParams;
  const state = parseNewsView(query);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("News");
  // Errors propagate to the route's error boundary, which offers a retry.
  const page = await listNews({
    lang: locale,
    cursor: typeof query.cursor === "string" ? query.cursor : undefined,
  });

  if (page.items.length === 0) {
    return <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />;
  }
  return (
    <div className="flex flex-col gap-6">
      <FeedToolbar state={state} />
      {state.view === "list" ? (
        <ul className="flex flex-col gap-4">
          {page.items.map((item) => (
            <li key={item.id}>
              <NewsListItem item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={gridClass(state.cols)}>
          {page.items.map((item) => (
            <li key={item.id} className="flex">
              <NewsCard item={item} sizes={gridImageSizes(state.cols)} />
            </li>
          ))}
        </ul>
      )}
      {page.next_cursor ? (
        <Link
          href={{
            pathname: "/news",
            query: { ...newsViewQuery(state), cursor: page.next_cursor },
          }}
          className={buttonVariants({
            variant: "outline",
            className: "self-center",
          })}
        >
          {t("loadMore")}
        </Link>
      ) : null}
    </div>
  );
}

export default function Page({ searchParams }: PageProps<"/[locale]/news">) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {t("News.title")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{t("News.lead")}</p>
      </header>
      <Suspense fallback={<LoadingState label={t("Loading.label")} rows={3} />}>
        <NewsFeed searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
