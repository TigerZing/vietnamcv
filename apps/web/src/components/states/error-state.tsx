import type { ReactNode } from "react";

export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-danger/40 bg-surface px-6 py-12 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-prose text-muted-foreground">{description}</p>
      {action}
    </section>
  );
}
