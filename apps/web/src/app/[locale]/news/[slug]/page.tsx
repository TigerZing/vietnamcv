import { ArrowLeft, Info, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { CommentSection } from "@/components/comments/comment-section";
import { ArticleBody } from "@/components/news/article-body";
import { ArticleImage } from "@/components/news/article-image";
import { CategoryBadge } from "@/components/news/category";
import { NewsTags } from "@/components/news/news-tags";
import { PostSources } from "@/components/news/post-sources";
import { SourceDate } from "@/components/news/source-date";
import { VideoEmbed } from "@/components/news/video-embed";
import { LoadingState } from "@/components/states/loading-state";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { mediaSrc } from "@/lib/media";
import { getNews, type NewsDetail } from "@/lib/news";
import { youtubeThumbnail } from "@/lib/youtube";

type Props = PageProps<"/[locale]/news/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getNews(slug, locale as Locale).catch(() => null);
  if (!post) return {};
  const path = `/${locale}/news/${slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: path,
      languages: { vi: `/vi/news/${slug}`, en: `/en/news/${slug}` },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url: path,
      publishedTime: post.published_at,
      images: post.image
        ? [{ url: mediaSrc(post.image.id), alt: post.image.alt }]
        : post.video
          ? [youtubeThumbnail(post.video.id)]
          : undefined,
    },
  };
}

function Article({ post, locale }: { post: NewsDetail; locale: Locale }) {
  const t = useTranslations("News");

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CategoryBadge category={post.category} />
          <Link
            href={{ pathname: "/news", query: { region: post.region } }}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <MapPin aria-hidden className="size-3.5" />
            {t(`regions.${post.region}`)}
          </Link>
        </div>
        <h1
          lang={post.language}
          className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl"
        >
          {post.title}
        </h1>
        <NewsTags tags={post.tags} />
        {/* Provenance above the fold (specs/08-UI-UX.md); the link sits at the end. */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {t("sourceLabel")}:{" "}
            <span className="font-medium text-foreground">
              {post.source.name}
            </span>
          </span>
          {post.source.published_on ? (
            <>
              <span aria-hidden>·</span>
              <span>
                {t("sourcePublished")}{" "}
                <SourceDate
                  value={post.source.published_on}
                  precision={post.source.published_precision}
                />
              </span>
            </>
          ) : null}
        </p>
        {post.language !== locale ? (
          <p className="text-sm text-muted-foreground">{t("notTranslated")}</p>
        ) : null}
      </header>

      {post.image ? <ArticleImage image={post.image} /> : null}

      <div lang={post.language} className="flex flex-col gap-5">
        <p className="text-lg leading-relaxed font-medium">{post.summary}</p>
        {post.body || post.figures.length > 0 ? (
          <ArticleBody body={post.body ?? null} figures={post.figures} />
        ) : null}
      </div>

      {post.video ? (
        <VideoEmbed id={post.video.id} title={post.video.title} />
      ) : null}

      <p className="text-sm text-muted-foreground">
        {post.ai_assisted ? t("aiNotice") : t("summaryNotice")}
      </p>

      {post.editor_note ? (
        <aside className="flex gap-3 rounded-lg border border-border bg-surface-muted p-4 text-sm">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
          <p>
            <span className="font-medium">{t("editorNote")}: </span>
            {post.editor_note}
          </p>
        </aside>
      ) : null}

      {post.keywords.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("keywords")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <li
                key={keyword}
                className="rounded-full border border-border px-3 py-1 text-xs"
              >
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <PostSources post={post} />
    </article>
  );
}

async function PostWithComments({ params, searchParams }: Props) {
  await connection();
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const post = await getNews(slug, locale as Locale);
  if (!post) notFound();
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Comments",
  });
  const loading = await getTranslations({
    locale: locale as Locale,
    namespace: "Loading",
  });

  return (
    <>
      <Article post={post} locale={locale as Locale} />
      <section
        id="comments"
        aria-labelledby="comments-heading"
        className="flex scroll-mt-20 flex-col gap-4 border-t border-border pt-8"
      >
        <h2 id="comments-heading" className="text-xl font-semibold">
          {t("title")}{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({post.comment_count})
          </span>
        </h2>
        <Suspense fallback={<LoadingState label={loading("label")} rows={2} />}>
          <CommentSection
            slug={slug}
            locale={locale as Locale}
            cursor={typeof query.c === "string" ? query.c : undefined}
            signIn={typeof query.signin === "string" ? query.signin : undefined}
          />
        </Suspense>
      </section>
    </>
  );
}

export default function Page(props: Props) {
  const t = useTranslations();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("News.backToList")}
      </Link>
      <Suspense fallback={<LoadingState label={t("Loading.label")} rows={4} />}>
        <PostWithComments {...props} />
      </Suspense>
    </div>
  );
}
