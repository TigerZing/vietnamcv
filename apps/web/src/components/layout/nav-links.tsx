"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

type NavLinksProps = {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
};

export function NavLinks(props: NavLinksProps) {
  return <NavLinksView {...props} pathname={usePathname()} />;
}

/**
 * The links without reading the URL. Routes with request-time params (news posts) render
 * this as the static-shell fallback, then stream in the version with the active link.
 */
export function NavLinksView({
  orientation = "horizontal",
  onNavigate,
  pathname,
}: NavLinksProps & { pathname: string | null }) {
  const t = useTranslations("Nav");

  return (
    <ul
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row items-center",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname !== null &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
