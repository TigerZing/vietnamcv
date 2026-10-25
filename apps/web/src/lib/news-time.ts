// Shared by server and client components (no server-only imports).

/** How old a news story is, by calendar day in Vietnam. */
export type NewsAge =
  | { kind: "today" }
  | { kind: "yesterday" }
  | { kind: "days"; count: number }
  | { kind: "date" };

const DAY_MS = 86_400_000;
// Days up to which a story counts as fresh and is highlighted.
export const FRESH_DAYS = 2;

/** Age of a source date ("YYYY-MM-DD") on the calendar of `timeZone` at `now`. */
export function newsAge(
  value: string,
  precision: "day" | "month",
  now: number,
  timeZone = "Asia/Ho_Chi_Minh",
): NewsAge {
  if (precision === "month") return { kind: "date" };
  // en-CA formats as YYYY-MM-DD.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${value}T00:00:00Z`)) /
      DAY_MS,
  );
  if (Number.isNaN(days)) return { kind: "date" };
  if (days <= 0) return { kind: "today" };
  if (days === 1) return { kind: "yesterday" };
  if (days < 7) return { kind: "days", count: days };
  return { kind: "date" };
}

export function isFresh(age: NewsAge): boolean {
  return (
    age.kind === "today" ||
    age.kind === "yesterday" ||
    (age.kind === "days" && age.count <= FRESH_DAYS)
  );
}

/**
 * The time a dynamic server render uses for relative dates. Call it only after
 * `connection()`, so the value belongs to the request and is never prerendered.
 */
export function requestTime(): number {
  return Date.now();
}
