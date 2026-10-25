export function LoadingState({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className="h-24 animate-pulse rounded-lg bg-surface-muted motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
