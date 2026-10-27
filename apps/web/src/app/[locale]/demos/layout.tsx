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
      {/* No visible header: the nav names the tab. The heading stays for screen readers. */}
      <h1 className="sr-only">{t("title")}</h1>
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
