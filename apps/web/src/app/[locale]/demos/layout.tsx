import { useTranslations } from "next-intl";

import { DemoList } from "@/components/demos/demo-list";
import { EmptyState } from "@/components/states/empty-state";
import { DEMOS } from "@/lib/demos";

/** Two columns from 1024px: the demo list on the left, the chosen demo on the right. */
export default function DemosLayout({
  children,
}: LayoutProps<"/[locale]/demos">) {
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <aside className="order-2 min-w-0 lg:sticky lg:top-20 lg:order-1 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1">
            <DemoList demos={DEMOS} />
          </aside>
          <div className="order-1 min-w-0 lg:order-2">{children}</div>
        </div>
      )}
    </div>
  );
}
