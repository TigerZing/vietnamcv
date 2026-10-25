import type { Metadata } from "next";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { NewsCard } from "@/components/news/news-card";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listNews } from "@/lib/news";

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
  const { cursor } = await searchParams;
  const t = await getTranslations("News");
  // Errors propagate to the route's error boundary, which offers a retry.
  const page = await listNews({
    cursor: typeof cursor === "string" ? cursor : undefined,
  });

  if (page.items.length === 0) {
    return <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />;
  }
  return (
    <div className="flex flex-col gap-8">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {page.items.map((item) => (
          <li key={item.id} className="flex">
            <NewsCard item={item} />
          </li>
        ))}
      </ul>
      {page.next_cursor ? (
        <Link
          href={{ pathname: "/news", query: { cursor: page.next_cursor } }}
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
