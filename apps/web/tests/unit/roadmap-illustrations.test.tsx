import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import vi from "../../messages/vi.json";
import { ILLUSTRATIONS } from "@/components/roadmap/illustrations";
import { VIEW } from "@/components/roadmap/illustrations/kit";
import { MILESTONE_ILLUSTRATIONS, MILESTONES } from "@/lib/roadmap";

describe("roadmap illustrations", () => {
  it("gives every milestone an illustration that exists", () => {
    for (const milestone of MILESTONES) {
      const id = MILESTONE_ILLUSTRATIONS[milestone.id];
      expect(ILLUSTRATIONS[id], milestone.id).toBeDefined();
    }
  });

  it("has a name and caption in both languages for every illustration", () => {
    const ids = Object.keys(ILLUSTRATIONS).sort();
    for (const messages of [vi, en]) {
      const copy = messages.Roadmap.illustrations as Record<
        string,
        { name: string; caption: string }
      >;
      expect(Object.keys(copy).sort()).toEqual(ids);
      for (const id of ids) {
        expect(copy[id]?.name.trim(), id).not.toBe("");
        expect(copy[id]?.caption.trim(), id).not.toBe("");
      }
    }
  });

  it("uses every illustration for at least one milestone", () => {
    const used = new Set(Object.values(MILESTONE_ILLUSTRATIONS));
    for (const id of Object.keys(ILLUSTRATIONS)) {
      expect(used.has(id as keyof typeof ILLUSTRATIONS), id).toBe(true);
    }
  });

  it("renders every illustration across the whole loop without errors", () => {
    for (const [id, illustration] of Object.entries(ILLUSTRATIONS)) {
      for (const phase of [
        0,
        0.13,
        0.37,
        0.5,
        0.71,
        0.99,
        illustration.still ?? 0.75,
      ]) {
        const { container, unmount } = render(
          <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}>
            {illustration.render(phase, `t-${id}`)}
          </svg>,
        );
        expect(
          container.querySelector("svg")?.childElementCount,
          id,
        ).toBeGreaterThan(0);
        expect(container.innerHTML, `${id}@${phase}`).not.toContain("NaN");
        unmount();
      }
    }
  });
});
