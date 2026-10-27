// Pure helpers for the admin dashboard (ADR-015); shared by server and client code.

export const ADMIN_TABS = ["news", "demos", "comments", "removed"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

export const COMMENT_STATUSES = ["published", "pending", "hidden"] as const;
export type CommentStatusFilter = (typeof COMMENT_STATUSES)[number];

export type AdminView = {
  tab: AdminTab;
  commentStatus: CommentStatusFilter;
  cursor: string | undefined;
};

type Query = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseAdminView(query: Query): AdminView {
  const tab = one(query.tab);
  const status = one(query.cs);
  const cursor = one(query.cursor);
  return {
    tab: ADMIN_TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "news",
    commentStatus: COMMENT_STATUSES.includes(status as CommentStatusFilter)
      ? (status as CommentStatusFilter)
      : "published",
    cursor: cursor && cursor.length <= 200 ? cursor : undefined,
  };
}

/** The query string for a view; defaults are left out so URLs stay short. */
export function adminQuery(view: Partial<AdminView>): Record<string, string> {
  const query: Record<string, string> = {};
  if (view.tab && view.tab !== "news") query.tab = view.tab;
  if (
    view.tab === "comments" &&
    view.commentStatus &&
    view.commentStatus !== "published"
  ) {
    query.cs = view.commentStatus;
  }
  if (view.cursor) query.cursor = view.cursor;
  return query;
}

/** Where a content item is shown on the site, without the locale prefix. */
export function contentPath(type: string, slug: string): string {
  return type === "demo"
    ? `/demos/${slug.replace(/^demo-/, "")}`
    : `/news/${slug}`;
}
