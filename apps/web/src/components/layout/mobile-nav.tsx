"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

import { NavLinks } from "./nav-links";

export function MobileNav() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        className="px-2"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X aria-hidden className="size-5" />
        ) : (
          <Menu aria-hidden className="size-5" />
        )}
      </Button>
      {open ? (
        <nav
          id={panelId}
          aria-label={t("label")}
          className="absolute inset-x-0 top-full border-b border-border bg-surface px-4 py-3 shadow-sm"
        >
          <NavLinks orientation="vertical" onNavigate={() => setOpen(false)} />
        </nav>
      ) : null}
    </div>
  );
}
