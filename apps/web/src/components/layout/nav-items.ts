import type { Messages } from "next-intl";

type NavKey = Exclude<
  keyof Messages["Nav"],
  "label" | "openMenu" | "closeMenu"
>;

export const NAV_ITEMS: ReadonlyArray<{ href: string; key: NavKey }> = [
  { href: "/discover", key: "discover" },
  { href: "/papers", key: "papers" },
  { href: "/open-source", key: "openSource" },
  { href: "/news", key: "news" },
  { href: "/roadmap", key: "roadmap" },
  { href: "/tasks", key: "tasks" },
  { href: "/demos", key: "demos" },
];
