import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { isMediaId } from "@/lib/media";

// Serves stored images on the web origin. The browser cannot reach the API's internal
// address, so this streams the bytes from it, keeping the API's cache headers.
const PASSED_HEADERS = [
  "content-type",
  "cache-control",
  "etag",
  "x-content-type-options",
  "content-security-policy",
] as const;

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/media/[id]">,
) {
  const { id } = await params;
  if (!isMediaId(id)) return new Response(null, { status: 404 });

  const ifNoneMatch = request.headers.get("if-none-match");
  const upstream = await fetch(
    new URL(`/api/v1/media/${id}`, env.API_INTERNAL_URL),
    {
      headers: ifNoneMatch ? { "If-None-Match": ifNoneMatch } : undefined,
      cache: "no-store",
    },
  );
  if (upstream.status !== 200 && upstream.status !== 304) {
    return new Response(null, {
      status: upstream.status === 404 ? 404 : 502,
    });
  }
  const headers = new Headers();
  for (const name of PASSED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.status === 304 ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}
