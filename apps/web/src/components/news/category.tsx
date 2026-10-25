import {
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  Cpu,
  Database,
  Factory,
  FlaskConical,
  Landmark,
  type LucideIcon,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type Category =
  | "industrial"
  | "medical-imaging"
  | "public-sector"
  | "robotics"
  | "market"
  | "models-open-source"
  | "edge-hardware"
  | "research"
  | "datasets"
  | "events"
  | "jobs";

const ICONS: Record<Category, LucideIcon> = {
  industrial: Factory,
  "medical-imaging": Stethoscope,
  "public-sector": Landmark,
  robotics: Bot,
  market: TrendingUp,
  "models-open-source": Boxes,
  "edge-hardware": Cpu,
  research: FlaskConical,
  datasets: Database,
  events: CalendarDays,
  jobs: BriefcaseBusiness,
};

// Hue per category for the card artwork; tints stay soft so text contrast is unaffected.
const HUES: Record<Category, number> = {
  industrial: 35,
  "medical-imaging": 350,
  "public-sector": 260,
  robotics: 205,
  market: 150,
  "models-open-source": 285,
  "edge-hardware": 230,
  research: 180,
  datasets: 120,
  events: 15,
  jobs: 60,
};

export function CategoryBadge({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const t = useTranslations("News.categories");
  const Icon = ICONS[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {t(category)}
    </span>
  );
}

/** Decorative artwork for posts without a video thumbnail. */
export function CategoryArt({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const Icon = ICONS[category];
  const hue = HUES[category];
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-center", className)}
      style={{
        background: `linear-gradient(135deg, oklch(0.93 0.05 ${hue}), oklch(0.8 0.09 ${hue + 30}))`,
      }}
    >
      <Icon
        className="size-12 opacity-70"
        style={{ color: `oklch(0.35 0.08 ${hue})` }}
        strokeWidth={1.5}
      />
    </div>
  );
}
