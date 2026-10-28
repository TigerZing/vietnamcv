"use client";

import {
  BookOpen,
  CirclePlay,
  CodeXml,
  Compass,
  Database,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  type LucideIcon,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import type { Locale } from "@/i18n/routing";
import {
  type DiscoverItem,
  type DiscoverKind,
  discoverHost,
  localizedPick,
  presentKinds,
} from "@/lib/discover";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<DiscoverKind, LucideIcon> = {
  article: FileText,
  video: CirclePlay,
  course: GraduationCap,
  book: BookOpen,
  interactive: MousePointerClick,
  code: CodeXml,
  dataset: Database,
  demo: Sparkles,
  other: Compass,
};

/** The picks as cards, with a kind filter when there is more than one kind. */
export function DiscoverGrid({ items }: { items: readonly DiscoverItem[] }) {
  const t = useTranslations("Discover");
  const [kind, setKind] = useState<DiscoverKind | null>(null);
  const kinds = presentKinds(items);
  const shown = kind ? items.filter((item) => item.kind === kind) : items;

  return (
    <div className="flex flex-col gap-6">
      {kinds.length > 1 ? (
        <KindFilter
          kinds={kinds}
          selected={kind}
          onSelect={setKind}
          total={items.length}
        />
      ) : null}
      <ul
        aria-label={t("listLabel")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((item) => (
          <li key={item.id} className="flex">
            <DiscoverCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function KindFilter({
  kinds,
  selected,
  onSelect,
  total,
}: {
  kinds: readonly DiscoverKind[];
  selected: DiscoverKind | null;
  onSelect: (kind: DiscoverKind | null) => void;
  total: number;
}) {
  const t = useTranslations("Discover");
  const options: {
    id: DiscoverKind | null;
    label: string;
    icon: LucideIcon;
  }[] = [
    { id: null, label: t("all", { count: total }), icon: Layers },
    ...kinds.map((id) => ({
      id,
      label: t(`kinds.${id}`),
      icon: KIND_ICONS[id],
    })),
  ];

  return (
    <section aria-labelledby="discover-kind-label">
      <h2 id="discover-kind-label" className="sr-only">
        {t("filterLabel")}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {options.map(({ id, label, icon: Icon }) => {
          const pressed = selected === id;
          return (
            <li key={id ?? "all"}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => onSelect(id)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm tabular-nums transition-colors",
                  pressed
                    ? "border-accent/50 bg-accent-soft font-medium text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DiscoverCard({ item }: { item: DiscoverItem }) {
  const t = useTranslations("Discover");
  const locale = useLocale() as Locale;
  const { title, summary } = localizedPick(item, locale);
  const Icon = KIND_ICONS[item.kind];

  return (
    <article className="group relative flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-accent/50">
      <p className="flex items-center gap-2 text-xs font-medium text-accent">
        <Icon aria-hidden className="size-4" />
        {t(`kinds.${item.kind}`)}
      </p>
      <h3 className="text-base leading-snug font-semibold text-balance">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="after:absolute after:inset-0 focus-visible:outline-none"
        >
          {title}
          <span className="sr-only"> {t("opensNewTab")}</span>
        </a>
      </h3>
      <p className="text-sm text-muted-foreground">{summary}</p>
      {item.tags.length > 0 ? (
        <ul aria-label={t("tags")} className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex min-h-6 items-center rounded-md bg-surface-muted px-2 font-mono text-xs text-muted-foreground"
            >
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">
          {item.source} · {discoverHost(item.url)}
        </span>
        <ExternalLink
          aria-hidden
          className="size-3.5 shrink-0 transition-colors group-hover:text-accent"
        />
      </p>
    </article>
  );
}
