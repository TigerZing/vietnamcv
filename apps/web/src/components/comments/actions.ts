"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";

import { api } from "@/lib/api";
import { getIdToken } from "@/lib/auth/session";
import type { CommentThread } from "@/lib/comments";

export type CommentFormState =
  | { status: "idle" }
  | { status: "published" | "pending"; at: number }
  | {
      status: "error";
      reason:
        | "rateLimited"
        | "duplicate"
        | "reservedName"
        | "invalid"
        | "signInRequired"
        | "error";
      retryMinutes?: number;
      at: number;
    };

const MODES = new Set(["anonymous", "guest", "account"]);

/** Posts a comment through the API, forwarding the visitor's IP and Google token. */
export async function postComment(
  thread: CommentThread,
  _previous: CommentFormState,
  form: FormData,
): Promise<CommentFormState> {
  const at = Date.now();
  const mode = String(form.get("mode") ?? "anonymous");
  if (!MODES.has(mode)) return { status: "error", reason: "invalid", at };

  const requestHeaders = await headers();
  const forwarded: Record<string, string> = {};
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip");
  if (clientIp) forwarded["X-Forwarded-For"] = clientIp;
  if (mode === "account") {
    const token = await getIdToken();
    if (!token) return { status: "error", reason: "signInRequired", at };
    forwarded.Authorization = `Bearer ${token}`;
  }

  const options = {
    params: { path: { slug: thread.slug } },
    body: {
      mode: mode as "anonymous" | "guest" | "account",
      body: String(form.get("body") ?? ""),
      display_name:
        mode === "guest" ? String(form.get("display_name") ?? "") : null,
      website: String(form.get("website") ?? "") || null,
    },
    headers: forwarded,
  };
  const { data, error, response } =
    thread.kind === "demos"
      ? await api.POST("/api/v1/demos/{slug}/comments", options)
      : await api.POST("/api/v1/news/{slug}/comments", options);

  if (data) {
    refresh();
    return {
      status: data.status === "published" ? "published" : "pending",
      at,
    };
  }

  const details = (error as { error?: { details?: Record<string, unknown> } })
    ?.error?.details;
  switch (response.status) {
    case 401:
      return { status: "error", reason: "signInRequired", at };
    case 409:
      return { status: "error", reason: "duplicate", at };
    case 429: {
      const seconds = Number(details?.retry_after_seconds ?? 60);
      return {
        status: "error",
        reason: "rateLimited",
        retryMinutes: Math.max(1, Math.ceil(seconds / 60)),
        at,
      };
    }
    case 422:
      return {
        status: "error",
        reason:
          details?.reason === "reserved_name" ? "reservedName" : "invalid",
        at,
      };
    default:
      console.error("comment_post_failed", response.status);
      return { status: "error", reason: "error", at };
  }
}
