import "server-only";

import type { components } from "@vietnamcv/api-client";

import { api, ApiError } from "./api";

export type AdminContentItem = components["schemas"]["AdminContentItem"];
export type AdminContentPage = components["schemas"]["AdminContentPage"];
export type AdminComment = components["schemas"]["QueuedComment"];
export type AdminCommentPage = components["schemas"]["ModerationQueue"];
export type AdminContentStatus = components["schemas"]["AdminContentStatus"];
export type AdminCommentStatus = components["schemas"]["CommentStatus"];

/** Rows per page on the admin dashboard. */
export const ADMIN_PAGE_SIZE = 50;

/** The admin's session is no longer accepted (expired, or the secret changed). */
export class AdminSignedOut extends Error {}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function listAdminContents(
  token: string,
  query: {
    type?: "news" | "demo";
    status: AdminContentStatus;
    cursor?: string;
  },
): Promise<AdminContentPage> {
  const { data, error, response } = await api.GET("/api/v1/admin/contents", {
    params: { query: { ...query, limit: ADMIN_PAGE_SIZE } },
    headers: auth(token),
    cache: "no-store",
  });
  if (response.status === 401) throw new AdminSignedOut();
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}

export async function listAdminComments(
  token: string,
  query: { status: AdminCommentStatus; cursor?: string },
): Promise<AdminCommentPage> {
  const { data, error, response } = await api.GET("/api/v1/admin/comments", {
    params: { query: { ...query, limit: ADMIN_PAGE_SIZE } },
    headers: auth(token),
    cache: "no-store",
  });
  if (response.status === 401) throw new AdminSignedOut();
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}
