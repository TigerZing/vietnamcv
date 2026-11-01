"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";

import { api } from "@/lib/api";
import { getViewer } from "@/lib/auth/session";
import { listComments } from "@/lib/comments";
import { env, googleSignInEnabled } from "@/lib/env";

const VISITOR_COOKIE = "vcv_visitor";
const VISITOR_MAX_AGE_SECONDS = 365 * 24 * 3600;

export type Engagement = { likes: number; comments: number; liked: boolean };

/** Reads engagement for the visitor's browser. Null when the API cannot be reached. */
export async function loadEngagement(slug: string): Promise<Engagement | null> {
  const visitor = (await cookies()).get(VISITOR_COOKIE)?.value;
  const { data } = await api
    .GET("/api/v1/videos/{slug}/engagement", {
      params: {
        path: { slug },
        header: visitor ? { "X-Visitor-Id": visitor } : {},
      },
      cache: "no-store",
    })
    .catch(() => ({ data: undefined }));
  return data ?? null;
}

/** Likes or unlikes, giving a new browser its visitor id on the first like. */
export async function setVideoLike(
  slug: string,
  liked: boolean,
): Promise<Engagement | null> {
  const store = await cookies();
  let visitor = store.get(VISITOR_COOKIE)?.value;
  if (!visitor) {
    visitor = randomUUID();
    store.set(VISITOR_COOKIE, visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NEXT_PUBLIC_SITE_URL.startsWith("https:"),
      maxAge: VISITOR_MAX_AGE_SECONDS,
      path: "/",
    });
  }

  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip");
  const options = {
    params: { path: { slug }, header: { "X-Visitor-Id": visitor } },
    headers: clientIp ? { "X-Forwarded-For": clientIp } : undefined,
  };
  const { data } = await (
    liked
      ? api.PUT("/api/v1/videos/{slug}/like", options)
      : api.DELETE("/api/v1/videos/{slug}/like", options)
  ).catch(() => ({ data: undefined }));
  return data ?? null;
}

/** One page of a video's thread, plus who is signed in for the comment form. */
export async function loadVideoComments(slug: string, cursor?: string) {
  const page = await listComments({ kind: "videos", slug }, cursor).catch(
    () => null,
  );
  const viewer = await getViewer();
  return {
    page,
    viewer: viewer ? { name: viewer.name, picture: viewer.picture } : null,
    googleEnabled: googleSignInEnabled,
  };
}
