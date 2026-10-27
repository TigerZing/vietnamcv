import "server-only";

import { api, ApiError } from "./api";
import type { CommentPage } from "./news";

/** What a comment thread hangs off: a news post or a demo product (ADR-013). */
export type CommentThread = { kind: "news" | "demos"; slug: string };

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
      : await api.GET("/api/v1/news/{slug}/comments", options);
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}
