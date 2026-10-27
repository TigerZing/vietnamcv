import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DemoView } from "@/components/demos/demo-view";
import type { Locale } from "@/i18n/routing";
import { DEMOS, demoThumbnail, findDemo } from "@/lib/demos";

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

/** A demo picked from the list: the player starts right away. */
export default async function Page({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const demo = findDemo(id);
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
