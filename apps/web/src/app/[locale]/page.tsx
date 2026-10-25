import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { NewsCard } from "@/components/news/news-card";
import { EmptyState } from "@/components/states/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listNews } from "@/lib/news";

async function LatestNews() {
  await connection();
  const t = await getTranslations();
  const page = await listNews({ limit: 3 }).catch(() => null);
  if (!page || page.items.length === 0) {
    return (
      <EmptyState
        title={t("Home.emptyTitle")}
        description={t("Home.emptyBody")}
      />
    );
  }
  return (
    <section aria-labelledby="latest-news" className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="latest-news" className="text-xl font-semibold">
          {t("News.latestTitle")}
        </h2>
        <Link
          href="/news"
          className={buttonVariants({
            variant: "ghost",
            className: "text-accent",
          })}
        >
          {t("News.seeAll")}
        </Link>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {page.items.map((item) => (
          <li key={item.id} className="flex">
            <NewsCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomePage() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 py-6 sm:py-10">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
      </section>
      <Suspense fallback={<div className="h-80" aria-hidden />}>
        <LatestNews />
      </Suspense>
    </div>
  );
}
