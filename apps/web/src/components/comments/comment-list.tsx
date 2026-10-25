import { BadgeCheck, UserRound } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import type { CommentOut } from "@/lib/news";

function Avatar({ comment }: { comment: CommentOut }) {
  const { author } = comment;
  if (author.avatar_url) {
    return (
      <Image
        src={author.avatar_url}
        alt=""
        width={40}
        height={40}
        unoptimized
        referrerPolicy="no-referrer"
        className="size-10 shrink-0 rounded-full"
      />
    );
  }
  if (author.kind === "anonymous" || !author.name) {
    return (
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground"
      >
        <UserRound className="size-5" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-foreground"
    >
      {author.name.charAt(0).toLocaleUpperCase()}
    </span>
  );
}

export function CommentList({
  comments,
  now,
}: {
  comments: CommentOut[];
  now: Date;
}) {
  const t = useTranslations("Comments");
  const format = useFormatter();

  return (
    <ol className="flex flex-col gap-5">
      {comments.map((comment) => {
        const { author } = comment;
        const name =
          author.kind === "anonymous"
            ? t("anonymous")
            : (author.name ?? t("member"));
        const created = new Date(comment.created_at);
        return (
          <li key={comment.id} className="flex gap-3">
            <Avatar comment={comment} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold">{name}</span>
                {author.verified ? (
                  <BadgeCheck
                    className="size-4 text-accent"
                    aria-label={t("verifiedBadge")}
                    role="img"
                  />
                ) : null}
                {author.kind === "guest" ? (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {t("guestBadge")}
                  </span>
                ) : null}
                <time
                  dateTime={comment.created_at}
                  title={format.dateTime(created, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  className="text-xs text-muted-foreground"
                >
                  {format.relativeTime(created, now)}
                </time>
              </div>
              <p className="text-sm break-words whitespace-pre-line">
                {comment.body}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
