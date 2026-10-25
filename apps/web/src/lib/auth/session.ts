import "server-only";

import { cookies } from "next/headers";

import { readIdTokenClaims, SESSION_COOKIE, type Viewer } from "./tokens";

/** The Google ID token held for the API, or null. Request-time: call inside Suspense. */
export async function getIdToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readIdTokenClaims(token, Date.now() / 1000) ? token : null;
}

/** Who is signed in, for display only. */
export async function getViewer(): Promise<Viewer | null> {
  const token = await getIdToken();
  return token ? readIdTokenClaims(token, Date.now() / 1000) : null;
}
