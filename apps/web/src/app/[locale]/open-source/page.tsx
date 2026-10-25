import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/states/coming-soon";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/open-source">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Nav",
  });
  return {
    title: t("openSource"),
    alternates: { canonical: `/${locale}/open-source` },
  };
}

export default function Page() {
  const t = useTranslations("Nav");
  return <ComingSoon heading={t("openSource")} />;
}
