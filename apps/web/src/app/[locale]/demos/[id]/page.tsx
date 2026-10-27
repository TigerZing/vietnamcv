import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { DemoView } from "@/components/demos/demo-view";
import { LoadingState } from "@/components/states/loading-state";
import type { Locale } from "@/i18n/routing";
import { DEMOS, demoThumbnail, findDemo } from "@/lib/demos";
import { listedDemos } from "@/lib/demos-listed";

type Props = PageProps<"/[locale]/demos/[id]">;

export function generateStaticParams() {
  return DEMOS.map((demo) => ({ id: demo.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const demo = findDemo(id);
  if (!demo) return {};
  const lang = locale as Locale;
  return {
    title: demo.title[lang],
    description: demo.description[lang],
    alternates: {
      canonical: `/${locale}/demos/${id}`,
      languages: { vi: `/vi/demos/${id}`, en: `/en/demos/${id}` },
    },
    openGraph: {
      title: demo.title[lang],
      description: demo.description[lang],
      images: [{ url: demoThumbnail(demo), width: 640, height: 360 }],
    },
  };
}

/** Request-time: a demo an admin deleted is not found (ADR-015). */
async function ListedDemo({ params, searchParams }: Props) {
  await connection();
  const { locale, id } = await params;
  const demo = (await listedDemos()).find((listed) => listed.id === id);
  if (!demo) notFound();
  return (
    <DemoView
      demo={demo}
      locale={locale as Locale}
      path={`/${locale}/demos/${id}`}
      autoplay
      searchParams={searchParams}
    />
  );
}

/** A demo picked from the list: the player starts right away. */
export default function Page(props: Props) {
  const t = useTranslations("Loading");
  return (
    <Suspense fallback={<LoadingState label={t("label")} rows={3} />}>
      <ListedDemo {...props} />
    </Suspense>
  );
}
