"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CommentForm,
  type CommentViewer,
} from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { Button } from "@/components/ui/button";
import type { CommentOut } from "@/lib/news";

import { loadVideoComments } from "./actions";

type Loaded = {
  items: CommentOut[];
  cursor: string | null;
  viewer: CommentViewer | null;
  googleEnabled: boolean;
  failed: boolean;
};

/** Bottom sheet on phones, a column beside the video from 1024px. */
export function VideoComments({
  slug,
  title,
  onClose,
  onPosted,
}: {
  slug: string;
  title: string;
  onClose: () => void;
  onPosted: () => void;
}) {
  const t = useTranslations("Videos");
  const tc = useTranslations("Comments");
  const locale = useLocale();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const close = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    const { page, viewer, googleEnabled } = await loadVideoComments(slug);
    setLoaded({
      items: page?.items ?? [],
      cursor: page?.next_cursor ?? null,
      viewer,
      googleEnabled,
      failed: page === null,
    });
  }, [slug]);

  useEffect(() => {
    let current = true;
    void loadVideoComments(slug).then(({ page, viewer, googleEnabled }) => {
      if (!current) return;
      setLoaded({
        items: page?.items ?? [],
        cursor: page?.next_cursor ?? null,
        viewer,
        googleEnabled,
        failed: page === null,
      });
    });
    return () => {
      current = false;
    };
  }, [slug]);

  useEffect(() => close.current?.focus(), []);

  const loadOlder = async () => {
    if (!loaded?.cursor) return;
    const { page } = await loadVideoComments(slug, loaded.cursor);
    if (!page) return;
    setLoaded({
      ...loaded,
      items: [...loaded.items, ...page.items],
      cursor: page.next_cursor ?? null,
    });
  };

  return (
    <aside
      aria-label={t("commentsOn", { title })}
      className="fixed inset-x-0 bottom-0 z-40 flex h-[70dvh] flex-col rounded-t-lg border border-border bg-surface lg:static lg:z-auto lg:h-auto lg:w-96 lg:shrink-0 lg:rounded-lg"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h2 className="font-semibold">{tc("title")}</h2>
        <Button
          ref={close}
          variant="ghost"
          className="size-9 p-0"
          aria-label={t("closeComments")}
          onClick={onClose}
        >
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {loaded === null ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <>
            <CommentForm
              key={slug}
              thread={{ kind: "videos", slug }}
              returnTo={`/${locale}/videos`}
              viewer={loaded.viewer}
              googleEnabled={loaded.googleEnabled}
              signInFailed={false}
              onPosted={() => {
                void load();
                onPosted();
              }}
            />
            {loaded.failed ? (
              <p role="alert" className="text-sm text-danger">
                {tc("loadError")}
              </p>
            ) : loaded.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tc("empty")}</p>
            ) : (
              <CommentList comments={loaded.items} now={new Date()} />
            )}
            {loaded.cursor ? (
              <Button
                variant="outline"
                className="self-start"
                onClick={() => void loadOlder()}
              >
                {tc("loadOlder")}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
