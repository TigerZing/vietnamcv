import { describe, expect, it } from "vitest";

import { readIdTokenClaims, safeReturnTo } from "@/lib/auth/tokens";

function token(claims: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256" })}.${encode(claims)}.signature`;
}

describe("safeReturnTo", () => {
  it("keeps same-site paths", () => {
    expect(safeReturnTo("/vi/news/abc")).toBe("/vi/news/abc");
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/vi\n/news",
  ])("rejects %j", (value) => {
    expect(safeReturnTo(value)).toBe("/vi/news");
  });
});

describe("readIdTokenClaims", () => {
  it("reads display claims from an unexpired token", () => {
    expect(
      readIdTokenClaims(
        token({
          exp: 2_000,
          name: "Nguyễn Văn A",
          picture: "https://lh3.googleusercontent.com/a/x",
        }),
        1_000,
      ),
    ).toEqual({
      name: "Nguyễn Văn A",
      picture: "https://lh3.googleusercontent.com/a/x",
      expiresAt: 2_000,
    });
  });

  it("returns null for expired or malformed tokens", () => {
    expect(readIdTokenClaims(token({ exp: 999 }), 1_000)).toBeNull();
    expect(readIdTokenClaims("not-a-jwt", 1_000)).toBeNull();
    expect(readIdTokenClaims("a.%%%.c", 1_000)).toBeNull();
  });

  it("drops non-https pictures", () => {
    expect(
      readIdTokenClaims(token({ exp: 2_000, picture: "javascript:x" }), 1_000)
        ?.picture,
    ).toBeNull();
  });
});
