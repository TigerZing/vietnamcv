"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";

import { api } from "@/lib/api";
import { ADMIN_COOKIE, getAdminSession } from "@/lib/auth/admin";
import { env } from "@/lib/env";

export type AdminLoginState =
  | { status: "idle" }
  | {
      status: "error";
      reason: "invalid" | "rateLimited" | "error";
      retryMinutes?: number;
      at: number;
    };

export type AdminActionResult =
  { ok: true } | { ok: false; reason: "signedOut" | "notFound" | "error" };

const secureCookie = env.NEXT_PUBLIC_SITE_URL.startsWith("https:");

async function clientHeaders(): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip");
  return clientIp ? { "X-Forwarded-For": clientIp } : {};
}

/** Checks the admin's username and password with the API and keeps the session cookie. */
export async function adminLogin(
  _previous: AdminLoginState,
  form: FormData,
): Promise<AdminLoginState> {
  const at = Date.now();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { status: "error", reason: "invalid", at };

  const { data, error, response } = await api.POST("/api/v1/admin/auth/login", {
    body: { username, password },
    headers: await clientHeaders(),
  });
  if (data) {
    const maxAge = Math.floor(
      (new Date(data.expires_at).getTime() - Date.now()) / 1000,
    );
    (await cookies()).set(ADMIN_COOKIE, data.access_token, {
      httpOnly: true,
      secure: secureCookie,
      // Strict: the session is never sent on requests started from another site.
      sameSite: "strict",
      path: "/",
      maxAge: Math.max(0, maxAge),
    });
    refresh();
    return { status: "idle" };
  }
  switch (response.status) {
    case 401:
    case 422:
      return { status: "error", reason: "invalid", at };
    case 429: {
      const details = (
        error as { error?: { details?: Record<string, unknown> } }
      )?.error?.details;
      const seconds = Number(details?.retry_after_seconds ?? 60);
      return {
        status: "error",
        reason: "rateLimited",
        retryMinutes: Math.max(1, Math.ceil(seconds / 60)),
        at,
      };
    }
    default:
      console.error("admin_login_failed", response.status);
      return { status: "error", reason: "error", at };
  }
}

export async function adminLogout(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  refresh();
}

async function withSession(
  call: (auth: { Authorization: string }) => Promise<{ response: Response }>,
): Promise<AdminActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, reason: "signedOut" };
  const { response } = await call({
    Authorization: `Bearer ${session.token}`,
  });
  if (response.ok) {
    refresh();
    return { ok: true };
  }
  if (response.status === 401) {
    (await cookies()).delete(ADMIN_COOKIE);
    refresh();
    return { ok: false, reason: "signedOut" };
  }
  if (response.status === 404) {
    refresh();
    return { ok: false, reason: "notFound" };
  }
  console.error("admin_action_failed", response.status);
  return { ok: false, reason: "error" };
}

/** Takes a news post or demo off the site; imports keep it deleted. */
export async function deleteContent(id: string): Promise<AdminActionResult> {
  return withSession((auth) =>
    api.DELETE("/api/v1/admin/contents/{content_id}", {
      params: { path: { content_id: id } },
      headers: auth,
    }),
  );
}

export async function restoreContent(id: string): Promise<AdminActionResult> {
  return withSession((auth) =>
    api.POST("/api/v1/admin/contents/{content_id}/restore", {
      params: { path: { content_id: id } },
      headers: auth,
    }),
  );
}

export async function deleteComment(id: string): Promise<AdminActionResult> {
  return withSession((auth) =>
    api.DELETE("/api/v1/admin/comments/{comment_id}", {
      params: { path: { comment_id: id } },
      headers: auth,
    }),
  );
}
