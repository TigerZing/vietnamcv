import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import vi from "../../messages/vi.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("translations", () => {
  it("English has exactly the same keys as Vietnamese", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(vi).sort());
  });

  it("has no empty strings", () => {
    for (const messages of [vi, en]) {
      const empty = keyPaths(messages).filter((path) => {
        const leaf = path
          .split(".")
          .reduce<unknown>(
            (node, key) => (node as Record<string, unknown>)[key],
            messages,
          );
        return typeof leaf === "string" && leaf.trim() === "";
      });
      expect(empty).toEqual([]);
    }
  });
});
