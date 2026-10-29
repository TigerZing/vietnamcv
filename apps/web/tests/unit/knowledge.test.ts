import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import vi from "../../messages/vi.json";
import {
  attentionWeights,
  GRID,
  PATCH_KINDS,
  patchPosition,
  toPercentages,
} from "@/lib/attention-toy";
import {
  bodyBlocks,
  nextTopic,
  REFERENCES,
  SECTION_ILLUSTRATIONS,
  TOPICS,
} from "@/lib/knowledge";
import { ILLUSTRATIONS } from "@/components/roadmap/illustrations";

describe("knowledge topics", () => {
  it("has copy, sections and sources for every topic", () => {
    for (const topic of TOPICS) {
      expect(topic.href).toBe(`/knowledge/${topic.id}`);
      expect(ILLUSTRATIONS[topic.cover]).toBeDefined();
      for (const messages of [vi, en]) {
        const sections = messages.Knowledge[topic.id].sections;
        expect(Object.keys(sections).length).toBeGreaterThanOrEqual(5);
        for (const section of Object.values(sections)) {
          expect(bodyBlocks(section.body).length).toBeGreaterThan(0);
        }
      }
      expect(REFERENCES[topic.id].length).toBeGreaterThan(0);
      for (const reference of REFERENCES[topic.id]) {
        expect(reference.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("only maps sections that exist to illustrations that exist", () => {
    for (const topic of TOPICS) {
      for (const [section, illustration] of Object.entries(
        SECTION_ILLUSTRATIONS[topic.id],
      )) {
        expect(Object.keys(vi.Knowledge[topic.id].sections)).toContain(section);
        expect(ILLUSTRATIONS[illustration]).toBeDefined();
      }
    }
  });

  it("links each topic to the next one, wrapping around", () => {
    expect(nextTopic("cnn").id).toBe("transformer");
    expect(nextTopic("transformer").id).toBe("cnn");
  });

  it("splits a body into paragraphs and bulleted lists", () => {
    expect(bodyBlocks("One\nline.\n\n- a\n- b\n\nLast.")).toEqual([
      { kind: "paragraph", text: "One line." },
      { kind: "list", items: ["a", "b"] },
      { kind: "paragraph", text: "Last." },
    ]);
  });
});

describe("toy self-attention", () => {
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

  it("gives a probability distribution over all patches", () => {
    expect(PATCH_KINDS).toHaveLength(GRID * GRID);
    for (let query = 0; query < PATCH_KINDS.length; query += 1) {
      for (const bias of [false, true]) {
        const weights = attentionWeights(query, bias);
        expect(sum(weights)).toBeCloseTo(1, 10);
        expect(sum(toPercentages(weights))).toBe(100);
      }
    }
  });

  it("attends by content without position bias", () => {
    const cat = PATCH_KINDS.indexOf("cat");
    const weights = attentionWeights(cat, false);
    const catShare = sum(
      weights.filter((_, index) => PATCH_KINDS[index] === "cat"),
    );
    expect(catShare).toBeGreaterThan(0.8);
    // Same content, same weight: distance does not matter yet.
    const cats = PATCH_KINDS.flatMap((kind, index) =>
      kind === "cat" ? [weights[index]] : [],
    );
    expect(new Set(cats).size).toBe(1);
  });

  it("favours nearby patches with position bias", () => {
    const grass = PATCH_KINDS.indexOf("grass"); // row 2, column 1
    const near = 8; // grass, row 3, column 1
    const far = 15; // grass, row 4, column 4
    const weights = attentionWeights(grass, true);
    expect(weights[near]).toBeGreaterThan(weights[far] ?? 1);
    expect(patchPosition(grass)).toEqual({ row: 2, col: 1 });
  });

  it("rounds percentages so they still add up to 100", () => {
    expect(toPercentages([1 / 3, 1 / 3, 1 / 3])).toEqual([34, 33, 33]);
  });
});
