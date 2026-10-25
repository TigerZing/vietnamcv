import "server-only";

import type { components } from "@vietnamcv/api-client";

import { api, ApiError } from "./api";

export type NewsSummary = components["schemas"]["NewsSummary"];
export type NewsDetail = components["schemas"]["NewsDetail"];
export type NewsPage = components["schemas"]["NewsPage"];
export type CommentOut = components["schemas"]["CommentOut"];
export type CommentPage = components["schemas"]["CommentPage"];
export type NewsCategory = NewsSummary["category"];
export type NewsLanguage = NewsSummary["language"];
export type TagCount = components["schemas"]["TagCount"];

/** Posts per page of the news list. */
export const NEWS_PAGE_SIZE = 15;

export async function listNews(query: {
  lang: NewsLanguage;
  cursor?: string;
  limit?: number;
  region?: NewsSummary["region"];
  tag?: string;
}): Promise<NewsPage> {
  const { data, error, response } = await api.GET("/api/v1/news", {
    params: {
      query: {
        limit: query.limit ?? NEWS_PAGE_SIZE,
        cursor: query.cursor,
        lang: query.lang,
        region: query.region,
        tag: query.tag,
      },
    },
    cache: "no-store",
  });
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}

/** Technology hashtags of published news, most used first. */
export async function listTags(
  region?: NewsSummary["region"],
): Promise<TagCount[]> {
  const { data, error, response } = await api.GET("/api/v1/news/tags", {
    params: { query: { region } },
    cache: "no-store",
  });
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data.items;
}

/** The published post, or null when it does not exist (404). */
export async function getNews(
  slug: string,
  lang: NewsLanguage,
): Promise<NewsDetail | null> {
  const { data, error, response } = await api.GET("/api/v1/news/{slug}", {
    params: { path: { slug }, query: { lang } },
    cache: "no-store",
  });
  if (response.status === 404 || response.status === 422) return null;
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}

export async function listComments(
  slug: string,
  cursor?: string,
): Promise<CommentPage> {
  const { data, error, response } = await api.GET(
    "/api/v1/news/{slug}/comments",
    {
      params: { path: { slug }, query: { limit: 30, cursor } },
      cache: "no-store",
    },
  );
  if (!data) throw ApiError.fromEnvelope(response.status, error);
  return data;
}
