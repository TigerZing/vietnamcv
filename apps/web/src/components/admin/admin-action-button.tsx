"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import {
  type AdminActionResult,
  deleteComment,
  deleteContent,
  restoreContent,
} from "./actions";

const ACTIONS = {
  deleteContent,
  restoreContent,
  deleteComment,
} as const;

export type AdminActionKind = keyof typeof ACTIONS;

/**
 * A delete (or restore) button that asks for a second press before acting, so a stray
 * click or tap never deletes anything. Escape or "Cancel" backs out.
 */
export function AdminActionButton({
  kind,
  id,
  label,
}: {
  kind: AdminActionKind;
  id: string;
  /** What is acted on, for screen readers: the post title or a comment excerpt. */
  label: string;
}) {
  const t = useTranslations("Admin.actions");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const restoring = kind === "restoreContent";
  const verb = restoring ? "restore" : "delete";

  function run() {
    startTransition(async () => {
      const outcome = await ACTIONS[kind](id);
      setResult(outcome);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div
        className="flex flex-wrap items-center gap-2"
        onKeyDown={(event) => {
          if (event.key === "Escape") setConfirming(false);
        }}
      >
        <span className="text-sm font-medium">{t(`${verb}Confirm`)}</span>
        <Button
          variant={restoring ? "primary" : "danger"}
          onClick={run}
          disabled={pending}
          autoFocus
          aria-label={`${t(`${verb}Yes`)}: ${label}`}
        >
          {pending ? t("working") : t(`${verb}Yes`)}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          {t("cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() => {
          setResult(null);
          setConfirming(true);
        }}
        aria-label={`${t(verb)}: ${label}`}
      >
        {restoring ? (
          <RotateCcw aria-hidden className="size-4" />
        ) : (
          <Trash2 aria-hidden className="size-4" />
        )}
        {t(verb)}
      </Button>
      {result && !result.ok ? (
        <span role="alert" className="text-sm text-danger">
          {t(`errors.${result.reason}`)}
        </span>
      ) : null}
    </div>
  );
}
