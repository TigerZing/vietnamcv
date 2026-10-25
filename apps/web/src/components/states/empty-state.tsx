import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-prose text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </section>
  );
}
