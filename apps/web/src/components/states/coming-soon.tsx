import { useTranslations } from "next-intl";

import { EmptyState } from "./empty-state";

/** Honest placeholder for MVP routes that are scheduled but not yet built. */
export function ComingSoon({ heading }: { heading: string }) {
  const t = useTranslations("ComingSoon");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      <EmptyState title={t("title")} description={t("body")} />
    </div>
  );
}
