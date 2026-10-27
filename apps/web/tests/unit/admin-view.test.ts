import { describe, expect, it } from "vitest";

import { adminQuery, contentPath, parseAdminView } from "@/lib/admin-view";

describe("parseAdminView", () => {
  it("defaults to published news", () => {
    expect(parseAdminView({})).toEqual({
      tab: "news",
      commentStatus: "published",
      cursor: undefined,
    });
  });

  it("reads known tabs, statuses and cursors only", () => {
    expect(
      parseAdminView({ tab: "comments", cs: "pending", cursor: "abc" }),
    ).toEqual({ tab: "comments", commentStatus: "pending", cursor: "abc" });
    expect(
      parseAdminView({ tab: "users", cs: ["hidden"], cursor: "x".repeat(201) }),
    ).toEqual({ tab: "news", commentStatus: "published", cursor: undefined });
  });
});

describe("adminQuery", () => {
  it("leaves defaults out", () => {
    expect(adminQuery({ tab: "news", commentStatus: "published" })).toEqual({});
    expect(adminQuery({ tab: "demos", cursor: "c1" })).toEqual({
      tab: "demos",
      cursor: "c1",
    });
  });

  it("keeps the comment status on the comments tab only", () => {
    expect(adminQuery({ tab: "comments", commentStatus: "hidden" })).toEqual({
      tab: "comments",
      cs: "hidden",
    });
    expect(adminQuery({ tab: "removed", commentStatus: "hidden" })).toEqual({
      tab: "removed",
    });
  });
});

describe("contentPath", () => {
  it("links news posts and demos to their pages", () => {
    expect(contentPath("news", "yolo-v12")).toBe("/news/yolo-v12");
    expect(contentPath("demo", "demo-07")).toBe("/demos/07");
  });
});
