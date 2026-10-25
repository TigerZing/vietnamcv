"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_THEME,
  isTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  // Keep other open tabs in sync with the latest choice.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(isTheme(event.newValue) ? event.newValue : DEFAULT_THEME);
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Theme {
  const value = document.documentElement.getAttribute("data-theme");
  return isTheme(value) ? value : DEFAULT_THEME;
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function ThemeToggle() {
  const t = useTranslations("Theme");
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // The inline script in <head> sets the theme on hard loads; this re-applies it after
  // React's development remount resets <html> attributes. A no-op in production.
  useLayoutEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      applyTheme(stored);
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, blocked): the choice lasts for this page only.
    }
  }

  return (
    <Button
      variant="ghost"
      className="px-2 text-muted-foreground hover:text-foreground"
      aria-label={theme === "dark" ? t("toLight") : t("toDark")}
      onClick={toggle}
    >
      {/* Icons follow the CSS variant so they are right before hydration too. */}
      <Sun aria-hidden className="hidden size-5 dark:block" />
      <Moon aria-hidden className="size-5 dark:hidden" />
    </Button>
  );
}
