import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import vi from "../../messages/vi.json";
import { ERAS, MILESTONES, milestonesByEra, timelineSpan } from "@/lib/roadmap";

describe("roadmap data", () => {
  it("has unique milestone ids", () => {
    const ids = MILESTONES.map((milestone) => milestone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique, chronological, non-overlapping eras", () => {
    const ids = ERAS.map((era) => era.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [index, era] of ERAS.entries()) {
      const previous = ERAS[index - 1];
      if (previous) expect(era.from).toBeGreaterThan(previous.to ?? era.from);
      if (era.to !== null) expect(era.to).toBeGreaterThanOrEqual(era.from);
      else expect(index).toBe(ERAS.length - 1);
    }
  });

  it("places every milestone inside the year range of its era", () => {
    for (const milestone of MILESTONES) {
      const era = ERAS.find((candidate) => candidate.id === milestone.era);
      expect(era, milestone.id).toBeDefined();
      expect(milestone.year, milestone.id).toBeGreaterThanOrEqual(era!.from);
      if (era!.to !== null) {
        expect(milestone.year, milestone.id).toBeLessThanOrEqual(era!.to);
      }
    }
  });

  it("gives every era at least one milestone, oldest first", () => {
    for (const era of ERAS) {
      const milestones = milestonesByEra(era.id);
      expect(milestones.length, era.id).toBeGreaterThan(0);
      const years = milestones.map((milestone) => milestone.year);
      expect(years, era.id).toEqual([...years].sort((a, b) => a - b));
    }
  });

  it("links sources over https only", () => {
    for (const milestone of MILESTONES) {
      if (!milestone.source) continue;
      expect(milestone.source, milestone.id).toMatch(/^https:\/\//);
    }
  });

  it("spans from the first milestone to the latest one", () => {
    const span = timelineSpan();
    const years = MILESTONES.map((milestone) => milestone.year);
    expect(span.from).toBe(Math.min(...years));
    expect(span.to).toBe(Math.max(...years));
    expect(span.years).toBe(span.to - span.from + 1);
  });

  it("has copy in both languages for every era, milestone and topic", () => {
    for (const messages of [vi, en]) {
      const roadmap = messages.Roadmap as {
        eras: Record<string, { name: string; period: string; blurb: string }>;
        milestones: Record<
          string,
          { title: string; summary: string; impact: string }
        >;
        topics: Record<string, string>;
      };
      expect(Object.keys(roadmap.eras).sort()).toEqual(
        ERAS.map((era) => era.id).sort(),
      );
      expect(Object.keys(roadmap.milestones).sort()).toEqual(
        MILESTONES.map((milestone) => milestone.id).sort(),
      );
      for (const milestone of MILESTONES) {
        expect(roadmap.topics[milestone.topic], milestone.topic).toBeTruthy();
        const entry = roadmap.milestones[milestone.id];
        expect(entry, milestone.id).toBeDefined();
        for (const field of ["title", "summary", "impact"] as const) {
          expect(entry?.[field].trim(), `${milestone.id}.${field}`).not.toBe(
            "",
          );
        }
      }
    }
  });
});
