import { useTranslations } from "next-intl";

import { LoadingState } from "@/components/states/loading-state";

export default function Loading() {
  const t = useTranslations("Loading");
  return <LoadingState label={t("label")} />;
}
