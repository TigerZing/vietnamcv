import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DemoView } from "@/components/demos/demo-view";
import type { Locale } from "@/i18n/routing";
import { DEMOS } from "@/lib/demos";

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

/** `/demos` shows the first demo, waiting for a press before loading LinkedIn. */
export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/demos">) {
  const { locale } = await params;
  const first = DEMOS[0];
  if (!first) return null;
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
