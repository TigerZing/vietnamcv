import { describe, expect, it } from "vitest";

import data from "@/content/discover.json";
import {
  DISCOVER_ITEMS,
  discoverHost,
  parseDiscover,
  presentKinds,
} from "@/lib/discover";

describe("discover", () => {
  it("has unique ids and links, each with copy in both languages", () => {
    expect(DISCOVER_ITEMS.length).toBeGreaterThan(0);
    expect(new Set(DISCOVER_ITEMS.map((item) => item.id)).size).toBe(
      DISCOVER_ITEMS.length,
    );
    expect(new Set(DISCOVER_ITEMS.map((item) => item.url)).size).toBe(
      DISCOVER_ITEMS.length,
    );
    for (const item of DISCOVER_ITEMS) {
      expect(item.summary.vi.length, item.id).toBeGreaterThan(80);
      expect(item.summary.en.length, item.id).toBeGreaterThan(80);
    }
  });

  it("lists the newest picks first and keeps the sheet order within a day", () => {
    const base = data.items[0]!;
    const items = parseDiscover({
      description: "",
      items: [
        { ...base, id: "a", addedOn: "2026-10-01" },
        { ...base, id: "b", addedOn: "2026-10-20" },
        { ...base, id: "c", addedOn: "2026-10-01" },
      ],
    });
    expect(items.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("rejects rows the sync must not write", () => {
    const base = data.items[0]!;
    const parse = (patch: object) => () =>
      parseDiscover({ description: "", items: [{ ...base, ...patch }] });
    expect(parse({ url: "http://example.com/" })).toThrow();
    expect(parse({ kind: "news" })).toThrow();
    expect(parse({ id: "Có dấu" })).toThrow();
    expect(parse({ addedOn: "28/10/2026" })).toThrow();
    expect(parse({ title: { vi: "Tiêu đề", en: " " } })).toThrow();
    expect(parse({ tags: ["#CNN"] })).toThrow();
  });

  it("names kinds in menu order and shows hosts without www", () => {
    expect(presentKinds(DISCOVER_ITEMS)[0]).toBe("article");
    expect(discoverHost("https://www.youtube.com/watch?v=x")).toBe(
      "youtube.com",
    );
  });
});
