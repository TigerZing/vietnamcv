export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";
export const THEME_STORAGE_KEY = "vietnamcv-theme";

/** Browser UI colour (`<meta name="theme-color">`) matching each theme's background. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#f8fafc",
  dark: "#0f172a",
};

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/**
 * Runs in `<head>` before the first paint: applies the saved theme to `<html>` so a
 * statically prerendered page (rendered with DEFAULT_THEME) never flashes the wrong one.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark")return;var d=document.documentElement;d.setAttribute("data-theme",t);var c=${JSON.stringify(
  THEME_COLORS,
)}[t];document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}catch(e){}})()`;
