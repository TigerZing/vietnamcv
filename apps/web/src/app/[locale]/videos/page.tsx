import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { VideoFeed } from "@/components/videos/video-feed";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/videos">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Videos",
  });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: `/${locale}/videos` },
  };
}

/** Static shell: the feed reads the local video server from the browser (ADR-019). */
export default function Page() {
  const t = useTranslations("Videos");
  return (
    <div className="-my-8 flex h-[calc(100dvh-4.0625rem)] flex-col py-2">
      <h1 className="sr-only">{t("title")}</h1>
      <VideoFeed />
    </div>
  );
}
