import { LogOut } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/states/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  type AdminComment,
  type AdminCommentPage,
  type AdminContentItem,
  type AdminContentPage,
  listAdminComments,
  listAdminContents,
} from "@/lib/admin";
import {
  ADMIN_TABS,
  type AdminView,
  adminQuery,
  COMMENT_STATUSES,
  contentPath,
} from "@/lib/admin-view";
import { cn } from "@/lib/utils";

import { AdminActionButton } from "./admin-action-button";
import { adminLogout } from "./actions";

type Format = Awaited<ReturnType<typeof getFormatter>>;
type Translate = Awaited<ReturnType<typeof getTranslations<"Admin">>>;

export type AdminData =
  | { kind: "contents"; page: AdminContentPage }
  | { kind: "comments"; page: AdminCommentPage };

/** Fetches what the view shows. Throws `AdminSignedOut` when the session is refused. */
export async function loadAdminData(
  token: string,
  view: AdminView,
): Promise<AdminData> {
  if (view.tab === "comments") {
    return {
      kind: "comments",
      page: await listAdminComments(token, {
        status: view.commentStatus,
        cursor: view.cursor,
      }),
    };
  }
  return {
    kind: "contents",
    page: await listAdminContents(token, {
      type:
        view.tab === "news"
          ? "news"
          : view.tab === "demos"
            ? "demo"
            : undefined,
      status: view.tab === "removed" ? "removed" : "published",
      cursor: view.cursor,
    }),
  };
}

const tabClass =
  "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** The signed-in admin's dashboard: every post, demo and comment, each with Delete. */
export async function AdminDashboard({
  username,
  view,
  data,
  locale,
}: {
  username: string | null;
  view: AdminView;
  data: AdminData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Admin" });

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("signedInAs", { name: username ?? "admin" })}
          </p>
        </div>
        <form action={adminLogout}>
          <Button type="submit" variant="outline">
            <LogOut aria-hidden className="size-4" />
            {t("logout")}
          </Button>
        </form>
      </header>

      <nav aria-label={t("tabsLabel")} className="border-b border-border pb-2">
        <ul className="flex flex-wrap gap-1">
          {ADMIN_TABS.map((tab) => (
            <li key={tab}>
              <Link
                href={{ pathname: "/admin", query: adminQuery({ tab }) }}
                aria-current={view.tab === tab ? "page" : undefined}
                className={cn(
                  tabClass,
                  view.tab === tab
                    ? "bg-accent-soft text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {t(`tabs.${tab}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {data.kind === "comments" ? (
        <CommentsPanel page={data.page} view={view} locale={locale} />
      ) : (
        <ContentPanel page={data.page} view={view} locale={locale} />
      )}
    </div>
  );
}

async function ContentPanel({
  page,
  view,
  locale,
}: {
  page: AdminContentPage;
  view: AdminView;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Admin" });
  const format = await getFormatter({ locale });
  const removed = view.tab === "removed";

  return (
    <section aria-labelledby="admin-panel" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="admin-panel" className="text-lg font-semibold">
          {t(`panels.${view.tab}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(`panels.${view.tab}.lead`)}
        </p>
      </div>
      {page.items.length === 0 ? (
        <EmptyState title={t(`panels.${view.tab}.empty`)} />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {page.items.map((item) => (
            <ContentRow
              key={item.id}
              item={item}
              removed={removed}
              format={format}
              t={t}
            />
          ))}
        </ul>
      )}
      <Pager view={view} next={page.next_cursor} t={t} />
    </section>
  );
}

function ContentRow({
  item,
  removed,
  format,
  t,
}: {
  item: AdminContentItem;
  removed: boolean;
  format: Format;
  t: Translate;
}) {
  const date = item.published_at ?? item.created_at;
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        {removed ? (
          <span className="font-medium break-words">{item.title}</span>
        ) : (
          <Link
            href={contentPath(item.type, item.slug)}
            className="font-medium break-words hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {item.title}
          </Link>
        )}
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="rounded bg-surface-muted px-1.5 py-px font-medium">
            {t(`types.${item.type}`)}
          </span>
          <time dateTime={date}>
            {format.dateTime(new Date(date), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
          <span>{t("commentCount", { count: item.comment_count })}</span>
        </p>
      </div>
      <div className="shrink-0">
        <AdminActionButton
          kind={removed ? "restoreContent" : "deleteContent"}
          id={item.id}
          label={item.title}
        />
      </div>
    </li>
  );
}

async function CommentsPanel({
  page,
  view,
  locale,
}: {
  page: AdminCommentPage;
  view: AdminView;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Admin" });
  const format = await getFormatter({ locale });

  return (
    <section aria-labelledby="admin-panel" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="admin-panel" className="text-lg font-semibold">
          {t("panels.comments.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("panels.comments.lead")}
        </p>
      </div>
      <ul aria-label={t("commentStatusLabel")} className="flex flex-wrap gap-1">
        {COMMENT_STATUSES.map((status) => (
          <li key={status}>
            <Link
              href={{
                pathname: "/admin",
                query: adminQuery({ tab: "comments", commentStatus: status }),
              }}
              aria-current={view.commentStatus === status ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "min-h-9 px-3",
                view.commentStatus === status
                  ? "bg-surface-muted"
                  : "text-muted-foreground",
              )}
            >
              {t(`commentStatuses.${status}`)}
            </Link>
          </li>
        ))}
      </ul>
      {page.items.length === 0 ? (
        <EmptyState title={t("panels.comments.empty")} />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {page.items.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              format={format}
              t={t}
            />
          ))}
        </ul>
      )}
      <Pager view={view} next={page.next_cursor} t={t} />
    </section>
  );
}

function CommentRow({
  comment,
  format,
  t,
}: {
  comment: AdminComment;
  format: Format;
  t: Translate;
}) {
  const author = comment.author.name ?? t("anonymous");
  const excerpt =
    comment.body.length > 60 ? `${comment.body.slice(0, 60)}…` : comment.body;
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm">
          <span className="font-medium">{author}</span>
          <span className="text-muted-foreground">
            {" · "}
            <time dateTime={comment.created_at}>
              {format.dateTime(new Date(comment.created_at), {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </span>
        </p>
        <p className="line-clamp-4 text-sm break-words whitespace-pre-line">
          {comment.body}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("commentOn")}{" "}
          <Link
            href={contentPath(comment.content_type, comment.content_slug)}
            className="font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {comment.content_title}
          </Link>
        </p>
      </div>
      <div className="shrink-0">
        <AdminActionButton
          kind="deleteComment"
          id={comment.id}
          label={excerpt}
        />
      </div>
    </li>
  );
}

function Pager({
  view,
  next,
  t,
}: {
  view: AdminView;
  next: string | null;
  t: Translate;
}) {
  if (!next && !view.cursor) return null;
  return (
    <nav aria-label={t("pagerLabel")} className="flex flex-wrap gap-2">
      {view.cursor ? (
        <Link
          href={{
            pathname: "/admin",
            query: adminQuery({ ...view, cursor: undefined }),
          }}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("firstPage")}
        </Link>
      ) : null}
      {next ? (
        <Link
          href={{
            pathname: "/admin",
            query: adminQuery({ ...view, cursor: next }),
          }}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("nextPage")}
        </Link>
      ) : null}
    </nav>
  );
}
