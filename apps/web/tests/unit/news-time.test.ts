import { describe, expect, it } from "vitest";

import { isFresh, newsAge } from "@/lib/news-time";

// 2026-10-25 08:00 in Vietnam (UTC+7).
const NOW = Date.parse("2026-10-25T01:00:00Z");

describe("newsAge", () => {
  it("counts calendar days in Vietnam", () => {
    expect(newsAge("2026-10-25", "day", NOW)).toEqual({ kind: "today" });
    expect(newsAge("2026-10-24", "day", NOW)).toEqual({ kind: "yesterday" });
    expect(newsAge("2026-10-20", "day", NOW)).toEqual({
      kind: "days",
      count: 5,
    });
    expect(newsAge("2026-10-18", "day", NOW)).toEqual({ kind: "date" });
  });

  it("uses the Vietnamese day even when UTC is still on the previous one", () => {
    // 23:30 UTC on the 24th is already the 25th in Vietnam.
    const late = Date.parse("2026-10-24T23:30:00Z");
    expect(newsAge("2026-10-25", "day", late)).toEqual({ kind: "today" });
  });

  it("shows month-only and future dates sensibly", () => {
    expect(newsAge("2026-10-01", "month", NOW)).toEqual({ kind: "date" });
    expect(newsAge("2026-10-26", "day", NOW)).toEqual({ kind: "today" });
  });

  it("marks the last two days as fresh", () => {
    expect(isFresh(newsAge("2026-10-23", "day", NOW))).toBe(true);
    expect(isFresh(newsAge("2026-10-22", "day", NOW))).toBe(false);
  });
});
