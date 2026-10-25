"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  return <LocaleSwitcherView pathname={usePathname()} />;
}

/** Static-shell fallback links to each locale's home until the current path is known. */
export function LocaleSwitcherView({ pathname }: { pathname: string }) {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();

  return (
    <nav aria-label={t("label")}>
      <ul className="flex items-center gap-1 text-sm">
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              className={cn(
                "rounded-md px-2 py-1 font-medium uppercase",
                locale === current
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span aria-hidden>{locale}</span>
              <span className="sr-only">{t(locale)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
