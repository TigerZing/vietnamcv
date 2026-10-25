import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

import { safeReturnTo, SESSION_COOKIE } from "@/lib/auth/tokens";

// POST only, so a link or image on another site cannot sign people out.
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(env.NEXT_PUBLIC_SITE_URL).origin) {
    return new NextResponse(null, { status: 403 });
  }
  const form = await request.formData();
  const returnTo = safeReturnTo(form.get("returnTo")?.toString());
  const response = NextResponse.redirect(
    new URL(returnTo, env.NEXT_PUBLIC_SITE_URL),
    {
      status: 303,
    },
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
