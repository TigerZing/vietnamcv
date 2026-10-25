import { describe, expect, it } from "vitest";

import { parseArticleBody } from "@/lib/article-body";

describe("parseArticleBody", () => {
  it("splits paragraphs, headings and lists", () => {
    const body =
      "Đoạn một\ntiếp tục.\n\n## Mục\n\n- Ý một\n- Ý hai\n\nĐoạn cuối.";
    expect(parseArticleBody(body)).toEqual([
      { kind: "paragraph", text: "Đoạn một tiếp tục." },
      { kind: "heading", text: "Mục" },
      { kind: "list", items: ["Ý một", "Ý hai"] },
      { kind: "paragraph", text: "Đoạn cuối." },
    ]);
  });

  it("keeps markup as plain text", () => {
    expect(parseArticleBody("<script>alert(1)</script>")).toEqual([
      { kind: "paragraph", text: "<script>alert(1)</script>" },
    ]);
  });

  it("ignores blank input and Windows line endings", () => {
    expect(parseArticleBody("\r\n\r\n")).toEqual([]);
    expect(parseArticleBody("A\r\n\r\nB")).toHaveLength(2);
  });

  it("places figures given on their own line", () => {
    expect(
      parseArticleBody("A\n\n{{figure:2}}\n\nB {{figure:1}}\n\n{{figure:0}}"),
    ).toEqual([
      { kind: "paragraph", text: "A" },
      { kind: "figure", index: 2 },
      { kind: "paragraph", text: "B {{figure:1}}" },
      { kind: "paragraph", text: "{{figure:0}}" },
    ]);
  });
});
