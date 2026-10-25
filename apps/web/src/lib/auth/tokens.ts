/**
 * Pure helpers for the Google sign-in flow (ADR-009). No secrets and no I/O here, so they
 * are unit-tested directly.
 */

export const SESSION_COOKIE = "vcv_google_id_token";
export const OAUTH_COOKIE = "vcv_google_oauth";

export type Viewer = {
  name: string | null;
  picture: string | null;
  expiresAt: number;
};

function decodeSegment(segment: string): unknown {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
}

/**
 * Reads display claims from an ID token WITHOUT verifying it. Only for showing who is
 * signed in: the API verifies the signature before trusting the token for anything.
 */
export function readIdTokenClaims(
  token: string,
  nowSeconds: number,
): Viewer | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const claims = decodeSegment(parts[1] ?? "") as Record<string, unknown>;
    const exp = typeof claims.exp === "number" ? claims.exp : 0;
    if (exp <= nowSeconds) return null;
    return {
      name: typeof claims.name === "string" ? claims.name : null,
      picture:
        typeof claims.picture === "string" &&
        claims.picture.startsWith("https://")
          ? claims.picture
          : null,
      expiresAt: exp,
    };
  } catch {
    return null;
  }
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return "/vi/news";
  }
  return value;
}

export function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
