"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <ul
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row items-center",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
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
