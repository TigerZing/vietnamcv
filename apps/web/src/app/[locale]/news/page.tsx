import type { Metadata } from "next";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { FeedToolbar } from "@/components/news/feed-toolbar";
import { RegionTabs, TagBar } from "@/components/news/news-filters";
import { NewsCard } from "@/components/news/news-card";
import { NewsListItem } from "@/components/news/news-list-item";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listNews, listTags } from "@/lib/news";
import { requestTime } from "@/lib/news-time";
import {
  gridClass,
  gridImageSizes,
  newsQuery,
  newsViewQuery,
  parseNewsFilters,
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

// Hashtags shown above the feed; the rest are reachable from the posts.
const TAG_BAR_SIZE = 12;

async function NewsFeed({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/news">["searchParams"];
}) {
  await connection();
  const query = await searchParams;
  const state = parseNewsView(query);
  const filters = parseNewsFilters(query);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("News");
  // Errors propagate to the route's error boundary, which offers a retry.
  const [page, tags] = await Promise.all([
    listNews({
      lang: locale,
      cursor: typeof query.cursor === "string" ? query.cursor : undefined,
      region: filters.region ?? undefined,
      tag: filters.tag ?? undefined,
    }),
    listTags(filters.region ?? undefined),
  ]);
  const now = requestTime();
  const filtered = filters.region !== null || filters.tag !== null;

  return (
    <div className="flex flex-col gap-5">
      <RegionTabs state={state} filters={filters} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <TagBar
          tags={tags.slice(0, TAG_BAR_SIZE)}
          state={state}
          filters={filters}
        />
        <div className="shrink-0">
          <FeedToolbar state={state} filters={filters} />
        </div>
      </div>
      {page.items.length === 0 ? (
        filtered ? (
          <EmptyState
            title={t("filters.emptyTitle")}
            description={t("filters.emptyBody")}
            action={
              <Link
                href={{ pathname: "/news", query: newsViewQuery(state) }}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("filters.clear")}
              </Link>
            }
          />
        ) : (
          <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
        )
      ) : state.view === "list" ? (
        <ul className="flex flex-col gap-3">
          {page.items.map((item) => (
            <li key={item.id}>
              <NewsListItem item={item} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={gridClass(state.cols)}>
          {page.items.map((item) => (
            <li key={item.id} className="flex">
              <NewsCard
                item={item}
                now={now}
                sizes={gridImageSizes(state.cols)}
              />
            </li>
          ))}
        </ul>
      )}
      {page.next_cursor ? (
        <Link
          href={{
            pathname: "/news",
            query: { ...newsQuery(state, filters), cursor: page.next_cursor },
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
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
