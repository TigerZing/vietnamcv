import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/states/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations();

  return (
    <EmptyState
      title={t("Errors.notFoundTitle")}
      description={t("Errors.notFoundBody")}
      action={
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("Common.backHome")}
        </Link>
      }
    />
  );
}
