import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { DiscoverGrid } from "@/components/discover/discover-grid";
import { EmptyState } from "@/components/states/empty-state";
import type { Locale } from "@/i18n/routing";
import { DISCOVER_ITEMS } from "@/lib/discover";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/discover">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Discover",
  });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: { canonical: `/${locale}/discover` },
  };
}

/** Static: the picks ship with the build (ADR-016). */
export default function Page() {
  const t = useTranslations("Discover");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("lead")}</p>
      </header>
      {DISCOVER_ITEMS.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <DiscoverGrid items={DISCOVER_ITEMS} />
      )}
    </div>
  );
}
