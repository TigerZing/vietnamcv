import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {t("Common.siteName")}
        </Link>
        <nav aria-label={t("Nav.label")} className="hidden flex-1 md:block">
          <NavLinks />
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            <Search aria-hidden className="size-5" />
            <span className="sr-only">{t("Nav.search")}</span>
          </Link>
          <LocaleSwitcher />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
