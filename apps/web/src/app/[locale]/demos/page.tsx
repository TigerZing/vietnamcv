import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { DemoGrid } from "@/components/demos/demo-grid";
import { EmptyState } from "@/components/states/empty-state";
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

export default function Page() {
  const t = useTranslations("Demos");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-prose text-muted-foreground">{t("lead")}</p>
      </header>
      {DEMOS.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <DemoGrid demos={DEMOS} />
      )}
    </div>
  );
}
