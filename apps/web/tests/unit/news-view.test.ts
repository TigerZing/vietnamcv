import { describe, expect, it } from "vitest";

import { newsViewQuery, parseNewsView } from "@/lib/news-view";

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
