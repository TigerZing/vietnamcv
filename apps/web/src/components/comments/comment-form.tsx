"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CommentThread } from "@/lib/comments";
import { cn } from "@/lib/utils";

import { type CommentFormState, postComment } from "./actions";

const BODY_MAX = 2000;
const NAME_MAX = 40;
const NAME_STORAGE_KEY = "vcv.comment.displayName";

type Mode = "anonymous" | "guest" | "account";

export type CommentViewer = { name: string | null; picture: string | null };

function readStoredName(): string {
  try {
    return window.localStorage.getItem(NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function storeName(name: string) {
  try {
    window.localStorage.setItem(NAME_STORAGE_KEY, name);
  } catch {
    // Storage can be unavailable (private mode); remembering the name is optional.
  }
}

export function CommentForm({
  thread,
  returnTo,
  viewer,
  googleEnabled,
  signInFailed,
}: {
  thread: CommentThread;
  returnTo: string;
  viewer: CommentViewer | null;
  googleEnabled: boolean;
  signInFailed: boolean;
}) {
  const t = useTranslations("Comments");
  const [state, action, pending] = useActionState<CommentFormState, FormData>(
    postComment.bind(null, thread),
    { status: "idle" },
  );
  const [mode, setMode] = useState<Mode>(viewer ? "account" : "anonymous");
  const [body, setBody] = useState("");
  const [clearedAt, setClearedAt] = useState(0);
  const ids = { name: useId(), body: useId(), hint: useId(), status: useId() };

  // Clear the text once per successful submission (state adjusted during render).
  if (
    (state.status === "published" || state.status === "pending") &&
    state.at !== clearedAt
  ) {
    setClearedAt(state.at);
    setBody("");
  }

  const modes: { value: Mode; disabled: boolean }[] = [
    { value: "anonymous", disabled: false },
    { value: "guest", disabled: false },
    { value: "account", disabled: !googleEnabled },
  ];

  const hint =
    mode === "account" && !googleEnabled
      ? t("modeHints.accountDisabled")
      : t(`modeHints.${mode}`);
  const needsSignIn = mode === "account" && !viewer;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
      {signInFailed ? (
        <p role="alert" className="text-sm text-danger">
          {t("signInFailed")}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("postAs")}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {modes.map(({ value, disabled }) => (
            <label
              key={value}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="mode-choice"
                value={value}
                checked={mode === value}
                disabled={disabled}
                onChange={() => setMode(value)}
                className="accent-[var(--accent)]"
                aria-describedby={ids.hint}
              />
              {t(`modes.${value}`)}
            </label>
          ))}
        </div>
        <p id={ids.hint} className="text-xs text-muted-foreground">
          {hint}
        </p>
      </fieldset>

      {mode === "account" && viewer ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            {viewer.picture ? (
              <Image
                src={viewer.picture}
                alt=""
                width={28}
                height={28}
                unoptimized
                referrerPolicy="no-referrer"
                className="size-7 rounded-full"
              />
            ) : null}
            <span className="truncate">
              {t("signedInAs", { name: viewer.name ?? t("member") })}
            </span>
          </span>
          <form action="/api/auth/logout" method="post">
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button type="submit" variant="ghost" className="min-h-9 px-2">
              <LogOut aria-hidden className="size-4" />
              {t("signOut")}
            </Button>
          </form>
        </div>
      ) : null}

      {needsSignIn && googleEnabled ? (
        <a
          href={`/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-4">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"
            />
          </svg>
          {t("signIn")}
        </a>
      ) : null}

      {!needsSignIn ? (
        <form
          action={(formData) => {
            if (mode === "guest") {
              storeName(String(formData.get("display_name") ?? "").trim());
            }
            action(formData);
          }}
          className="flex flex-col gap-3"
          aria-describedby={ids.status}
        >
          <input type="hidden" name="mode" value={mode} />
          {mode === "guest" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.name} className="text-sm font-medium">
                {t("nameLabel")}
              </label>
              <input
                id={ids.name}
                name="display_name"
                // Prefill the name remembered from the last guest comment.
                ref={(element) => {
                  if (element && !element.value)
                    element.value = readStoredName();
                }}
                required
                minLength={2}
                maxLength={NAME_MAX}
                autoComplete="nickname"
                placeholder={t("namePlaceholder")}
                className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.body} className="text-sm font-medium">
              {t("bodyLabel")}
            </label>
            <textarea
              id={ids.body}
              name="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              minLength={2}
              maxLength={BODY_MAX}
              rows={4}
              placeholder={t("bodyPlaceholder")}
              className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <span className="self-end text-xs text-muted-foreground">
              {t("counter", { count: body.length, max: BODY_MAX })}
            </span>
          </div>
          {/* Honeypot: invisible to people and skipped by keyboard and screen readers. */}
          <div
            aria-hidden
            className="absolute -left-[10000px] h-px w-px overflow-hidden"
          >
            <label>
              {t("honeypot")}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("rules")}</p>
            <Button type="submit" disabled={pending} className="shrink-0">
              {pending ? t("submitting") : t("submit")}
            </Button>
          </div>
          <p
            id={ids.status}
            role="status"
            aria-live="polite"
            className={cn(
              "text-sm",
              state.status === "error" ? "text-danger" : "text-foreground",
            )}
          >
            {state.status === "published" ? t("result.published") : null}
            {state.status === "pending" ? t("result.pending") : null}
            {state.status === "error"
              ? state.reason === "rateLimited"
                ? t("result.rateLimited", { minutes: state.retryMinutes ?? 1 })
                : t(`result.${state.reason}`)
              : null}
          </p>
        </form>
      ) : null}
    </div>
  );
}
