import { type NextRequest, NextResponse } from "next/server";

import { authorizeUrl, newOAuthState } from "@/lib/auth/google";
import { OAUTH_COOKIE, safeReturnTo } from "@/lib/auth/tokens";
import { env, googleSignInEnabled } from "@/lib/env";

const TEN_MINUTES = 10 * 60;

export function GET(request: NextRequest) {
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (!googleSignInEnabled) {
    return NextResponse.redirect(new URL(returnTo, env.NEXT_PUBLIC_SITE_URL));
  }
  const oauth = newOAuthState(returnTo);
  const response = NextResponse.redirect(authorizeUrl(oauth));
  response.cookies.set(OAUTH_COOKIE, JSON.stringify(oauth), {
    httpOnly: true,
    secure: env.NEXT_PUBLIC_SITE_URL.startsWith("https:"),
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: TEN_MINUTES,
  });
  return response;
}
