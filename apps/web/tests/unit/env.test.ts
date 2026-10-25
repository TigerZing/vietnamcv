import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
vi.stubEnv("API_INTERNAL_URL", "http://localhost:8000");

const { parseEnv } = await import("@/lib/env");

describe("parseEnv", () => {
  it("accepts valid URLs", () => {
    expect(
      parseEnv({
        NEXT_PUBLIC_SITE_URL: "https://vietnamcv.example",
        API_INTERNAL_URL: "http://api:8000",
      }),
    ).toEqual({
      NEXT_PUBLIC_SITE_URL: "https://vietnamcv.example",
      API_INTERNAL_URL: "http://api:8000",
    });
  });

  it("names every missing or invalid variable", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow(
      /NEXT_PUBLIC_SITE_URL[\s\S]*API_INTERNAL_URL/,
    );
  });
});

describe("Google sign-in configuration", () => {
  const base = {
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    API_INTERNAL_URL: "http://localhost:8000",
  };

  it("is optional, and blank values count as unset", () => {
    expect(
      parseEnv({ ...base, GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: " " })
        .GOOGLE_CLIENT_ID,
    ).toBeUndefined();
  });

  it("needs the client ID and secret together", () => {
    expect(() => parseEnv({ ...base, GOOGLE_CLIENT_ID: "id" })).toThrow(
      /GOOGLE_CLIENT_SECRET/,
    );
    expect(
      parseEnv({ ...base, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" })
        .GOOGLE_CLIENT_SECRET,
    ).toBe("s");
  });
});
