import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/session";
import { googleSignInEnabled } from "@/lib/env";
import { listComments } from "@/lib/news";

import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

/** Comments and the comment form. Request-time: render inside <Suspense>. */
export async function CommentSection({
  slug,
  locale,
  cursor,
  signIn,
}: {
  slug: string;
  locale: Locale;
  cursor?: string;
  signIn?: string;
}) {
  await connection();
  const t = await getTranslations({ locale, namespace: "Comments" });
  const viewer = await getViewer();
  const path = `/${locale}/news/${slug}`;
  const page = await listComments(slug, cursor).catch(() => null);

  return (
    <div className="flex flex-col gap-6">
      <CommentForm
        slug={slug}
        returnTo={path}
        viewer={viewer ? { name: viewer.name, picture: viewer.picture } : null}
        googleEnabled={googleSignInEnabled}
        signInFailed={signIn === "failed"}
      />
      {page === null ? (
        <p role="alert" className="text-sm text-danger">
          {t("loadError")}
        </p>
      ) : page.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <CommentList comments={page.items} now={new Date()} />
          {page.next_cursor ? (
            <a
              href={`${path}?c=${encodeURIComponent(page.next_cursor)}#comments`}
              className={buttonVariants({
                variant: "outline",
                className: "self-start",
              })}
            >
              {t("loadOlder")}
            </a>
          ) : null}
        </>
      )}
    </div>
  );
}
