"use client";

import { ExternalLink, LoaderCircle, MonitorSmartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { CNN_EXPLAINER } from "@/lib/knowledge";

declare global {
  interface Window {
    CnnExplainer?: { mount: (target: HTMLElement) => () => void };
  }
}

let loading: Promise<void> | null = null;

/** Adds the stylesheet and the scripts once per page load, scripts in order. */
function loadCnnExplainer(): Promise<void> {
  loading ??= (async () => {
    if (!document.querySelector(`link[href="${CNN_EXPLAINER.stylesheet}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CNN_EXPLAINER.stylesheet;
      document.head.append(link);
    }
    for (const src of CNN_EXPLAINER.scripts) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Could not load ${src}`));
        document.body.append(script);
      });
    }
  })().catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

/**
 * The interactive overview of CNN Explainer (Polo Club, MIT License), built from its
 * source by `tools/cnn-explainer/build.sh` and mounted straight into this page. Its styles
 * are scoped under `.cnn-explainer`; the element it mounts into belongs to it, so React
 * renders nothing inside that element.
 */
export function CnnExplainer() {
  const t = useTranslations("Knowledge.cnn.explainer");
  const target = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let destroy: (() => void) | undefined;
    let cancelled = false;
    loadCnnExplainer()
      .then(() => {
        if (cancelled || !target.current || !window.CnnExplainer) return;
        destroy = window.CnnExplainer.mount(target.current);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return (
    <section
      aria-labelledby="cnn-explainer-title"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="cnn-explainer-title"
          className="text-xl font-semibold tracking-tight"
        >
          {t("title")}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("body")}</p>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-muted-foreground xl:hidden">
        <MonitorSmartphone aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t("narrowHint")}
      </p>

      <div
        role="region"
        aria-label={t("label")}
        aria-busy={state === "loading"}
        className="relative -mx-4 min-h-[560px] overflow-hidden border-y border-border sm:-mx-6"
      >
        <div className="cnn-explainer">
          <div ref={target} className="min-w-[1100px]" />
        </div>
        {state !== "ready" ? (
          <p
            role={state === "error" ? "alert" : "status"}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-surface text-sm text-muted-foreground"
          >
            {state === "loading" ? (
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
            ) : null}
            {t(state)}
          </p>
        ) : null}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {t("credit")}{" "}
        <span className="inline-flex flex-wrap gap-x-3">
          {(
            [
              ["license", CNN_EXPLAINER.license],
              ["paper", CNN_EXPLAINER.paper],
              ["source", CNN_EXPLAINER.source],
              ["openOriginal", CNN_EXPLAINER.original],
            ] as const
          ).map(([key, href]) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              {t(key)}
              <ExternalLink aria-hidden className="size-3" />
            </a>
          ))}
        </span>
      </p>
    </section>
  );
}
