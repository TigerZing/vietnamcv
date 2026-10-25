import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/states/empty-state";

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
      <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
    </div>
  );
}
