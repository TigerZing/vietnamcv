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
});
