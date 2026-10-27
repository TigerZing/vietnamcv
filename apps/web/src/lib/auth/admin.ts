import "server-only";

import { cookies } from "next/headers";

import { readIdTokenClaims } from "./tokens";

/** httpOnly cookie holding the API's admin session token (ADR-015). */
export const ADMIN_COOKIE = "vcv_admin_session";

export type AdminSession = { token: string; username: string | null };

/** The admin session, or null when signed out or expired. Request-time: call inside Suspense. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  // Display claims only: the API verifies the signature on every call.
  const claims = readIdTokenClaims(token, Date.now() / 1000);
  return claims ? { token, username: claims.name } : null;
}
