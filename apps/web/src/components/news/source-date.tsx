import { useFormatter } from "next-intl";

/** A source date, shown as a month when the source only gave the month. */
export function SourceDate({
  value,
  precision,
}: {
  value: string;
  precision: "day" | "month";
}) {
  const format = useFormatter();
  // Dates are calendar days without a time; format them in UTC so they never shift.
  const date = new Date(`${value}T00:00:00Z`);
  return (
    <time dateTime={precision === "month" ? value.slice(0, 7) : value}>
      {format.dateTime(
        date,
        precision === "month"
          ? { month: "long", year: "numeric", timeZone: "UTC" }
          : { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
      )}
    </time>
  );
}
