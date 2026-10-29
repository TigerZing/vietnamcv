import { ExternalLink, Maximize2, MonitorSmartphone } from "lucide-react";
import { useTranslations } from "next-intl";

import { CNN_EXPLAINER } from "@/lib/knowledge";

/**
 * CNN Explainer (Polo Club, MIT License) embedded from the copy served under
 * `public/cnn-explainer`. The iframe isolates its global styles and scripts from the site;
 * the credit and licence links sit right under it.
 */
export function CnnExplainerEmbed() {
  const t = useTranslations("Knowledge.cnn.explainer");

  return (
    <section
      aria-labelledby="cnn-explainer-title"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2
            id="cnn-explainer-title"
            className="text-xl font-semibold tracking-tight"
          >
            {t("title")}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            {t("body")}
          </p>
        </div>
        <a
          href={CNN_EXPLAINER.embed}
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          <Maximize2 aria-hidden className="size-4" />
          {t("openFull")}
        </a>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-muted-foreground lg:hidden">
        <MonitorSmartphone aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t("narrowHint")}
      </p>

      <iframe
        src={CNN_EXPLAINER.embed}
        title={t("frameTitle")}
        loading="lazy"
        className="h-[80vh] max-h-[960px] min-h-[560px] w-full rounded-lg border border-border bg-white"
      />

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
