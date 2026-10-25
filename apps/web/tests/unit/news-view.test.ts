import { describe, expect, it } from "vitest";

import {
  newsQuery,
  newsViewQuery,
  parseNewsFilters,
  parseNewsView,
} from "@/lib/news-view";

describe("parseNewsView", () => {
  it("defaults to the list view", () => {
    expect(parseNewsView({})).toEqual({ view: "list", cols: 3 });
  });

  it("reads the card view and column count", () => {
    expect(parseNewsView({ view: "grid", cols: "4" })).toEqual({
      view: "grid",
      cols: 4,
    });
  });

  it("ignores unknown values", () => {
    expect(parseNewsView({ view: "table", cols: "9" })).toEqual({
      view: "list",
      cols: 3,
    });
    expect(parseNewsView({ view: ["grid"], cols: ["2"] })).toEqual({
      view: "list",
      cols: 3,
    });
  });
});

describe("newsViewQuery", () => {
  it("leaves defaults out of the URL", () => {
    expect(newsViewQuery({ view: "list", cols: 4 })).toEqual({});
    expect(newsViewQuery({ view: "grid", cols: 3 })).toEqual({ view: "grid" });
    expect(newsViewQuery({ view: "grid", cols: 2 })).toEqual({
      view: "grid",
      cols: "2",
    });
  });
});

describe("parseNewsFilters", () => {
  it("reads region and hashtag, with or without #", () => {
    expect(parseNewsFilters({ region: "vietnam", tag: "#VLM" })).toEqual({
      region: "vietnam",
      tag: "VLM",
    });
  });

  it("ignores unknown regions and invalid tags", () => {
    expect(parseNewsFilters({ region: "mars", tag: "a b" })).toEqual({
      region: null,
      tag: null,
    });
    expect(parseNewsFilters({ tag: ["VLM"] })).toEqual({
      region: null,
      tag: null,
    });
  });
});

describe("newsQuery", () => {
  it("keeps filters and layout together, leaving defaults out", () => {
    expect(
      newsQuery(
        { view: "grid", cols: 2 },
        { region: "international", tag: "OCR" },
      ),
    ).toEqual({ region: "international", tag: "OCR", view: "grid", cols: "2" });
    expect(
      newsQuery({ view: "list", cols: 3 }, { region: null, tag: null }),
    ).toEqual({});
  });
});
