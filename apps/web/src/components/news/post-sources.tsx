import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import type { NewsDetail } from "@/lib/news";

import { SourceDate } from "./source-date";

/** Source and related links, at the end of the post. */
export function PostSources({ post }: { post: NewsDetail }) {
  const t = useTranslations("News");
  return (
    <section
      aria-labelledby="post-sources"
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted p-5"
    >
      <h2 id="post-sources" className="text-base font-semibold">
        {t("sourcesTitle")}
      </h2>
      <div className="flex flex-col gap-1 text-sm">
        <p>
          {t("sourceLabel")}:{" "}
          <span className="font-medium">{post.source.name}</span>
          {post.source.published_on ? (
            <>
              {" · "}
              {t("sourcePublished")}{" "}
              <SourceDate
                value={post.source.published_on}
                precision={post.source.published_precision}
              />
            </>
          ) : null}
        </p>
        <p className="text-muted-foreground">
          {t("originalLanguage", {
            language: t(
              `languages.${post.original_language === "vi" || post.original_language === "en" ? post.original_language : "other"}`,
            ),
          })}
        </p>
        {post.original_title !== post.title ? (
          <p className="text-muted-foreground">
            {t("originalTitle")}:{" "}
            <span lang={post.original_language}>{post.original_title}</span>
          </p>
        ) : null}
      </div>
      <a
        href={post.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90"
      >
        {t("readOriginal", { source: post.source.name })}
        <ExternalLink aria-hidden className="size-4" />
      </a>
      {post.links.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("relatedLinks")}
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {post.links.map((link) => (
              <li
                key={link.url}
                className="flex flex-wrap items-baseline gap-2"
              >
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                  {t(`linkKinds.${link.kind}`)}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-accent underline-offset-2 hover:underline"
                >
                  {link.label}
                  <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
