import "server-only";

import { api, ApiError } from "./api";
import type { CommentPage } from "./news";

/** What a comment thread hangs off: a news post, a demo (ADR-013) or a video (ADR-019). */
export type CommentThread = { kind: "news" | "demos" | "videos"; slug: string };

export async function listComments(
  thread: CommentThread,
  cursor?: string,
): Promise<CommentPage> {
  const options = {
    params: { path: { slug: thread.slug }, query: { limit: 30, cursor } },
    cache: "no-store" as const,
  };
  const { data, error, response } =
    thread.kind === "demos"
      ? await api.GET("/api/v1/demos/{slug}/comments", options)
      : thread.kind === "videos"
        ? await api.GET("/api/v1/videos/{slug}/comments", options)
        : await api.GET("/api/v1/news/{slug}/comments", options);
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}
