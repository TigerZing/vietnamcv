"use client";

import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <ErrorState
      title={t("Errors.errorTitle")}
      description={t("Errors.errorBody")}
      action={<Button onClick={reset}>{t("Common.retry")}</Button>}
    />
  );
}
