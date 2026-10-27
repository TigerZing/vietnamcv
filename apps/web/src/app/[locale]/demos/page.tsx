import type { Metadata } from "next";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { DemoView } from "@/components/demos/demo-view";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import type { Locale } from "@/i18n/routing";
import { listedDemos } from "@/lib/demos-listed";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/demos">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Demos",
  });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: `/${locale}/demos` },
  };
}

/** The first demo still on the site (request-time: some may have been deleted). */
async function FirstDemo({
  params,
  searchParams,
}: PageProps<"/[locale]/demos">) {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Demos",
  });
  const first = (await listedDemos())[0];
  if (!first) {
    return <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />;
  }
  return (
    <DemoView
      demo={first}
      locale={locale as Locale}
      path={`/${locale}/demos`}
      autoplay={false}
      searchParams={searchParams}
    />
  );
}

/** `/demos` shows the first demo, waiting for a press before loading LinkedIn. */
export default function Page(props: PageProps<"/[locale]/demos">) {
  const t = useTranslations("Loading");
  return (
    <Suspense fallback={<LoadingState label={t("label")} rows={3} />}>
      <FirstDemo {...props} />
    </Suspense>
  );
}
