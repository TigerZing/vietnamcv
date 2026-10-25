import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

import { exchangeCode, type OAuthState } from "@/lib/auth/google";
import {
  OAUTH_COOKIE,
  readIdTokenClaims,
  safeReturnTo,
  SESSION_COOKIE,
} from "@/lib/auth/tokens";

function parseState(raw: string | undefined): OAuthState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<OAuthState>;
    return typeof value.state === "string" &&
      typeof value.verifier === "string" &&
      typeof value.nonce === "string"
      ? { ...(value as OAuthState), returnTo: safeReturnTo(value.returnTo) }
      : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const oauth = parseState(request.cookies.get(OAUTH_COOKIE)?.value);
  const returnTo = oauth?.returnTo ?? safeReturnTo(null);
  const back = (outcome: string) => {
    const url = new URL(returnTo, env.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set("signin", outcome);
    url.hash = "comments";
    return url;
  };

  const code = params.get("code");
  if (!oauth || !code || params.get("state") !== oauth.state) {
    const response = NextResponse.redirect(back("failed"));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  }

  try {
    const idToken = await exchangeCode(code, oauth);
    const claims = readIdTokenClaims(idToken, Date.now() / 1000);
    if (!claims) throw new Error("ID token already expired");
    const response = NextResponse.redirect(back("ok"));
    response.cookies.delete(OAUTH_COOKIE);
    response.cookies.set(SESSION_COOKIE, idToken, {
      httpOnly: true,
      secure: env.NEXT_PUBLIC_SITE_URL.startsWith("https:"),
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, Math.floor(claims.expiresAt - Date.now() / 1000)),
    });
    return response;
  } catch (error) {
    console.warn("google_sign_in_failed", (error as Error).message);
    const response = NextResponse.redirect(back("failed"));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  }
}
