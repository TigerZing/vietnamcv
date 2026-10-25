import Image from "next/image";
import { useTranslations } from "next-intl";

import type { NewsSummary } from "@/lib/news";
import { mediaSrc } from "@/lib/media";

type StoredImage = NonNullable<NewsSummary["image"]>;

export function ArticleImage({ image }: { image: StoredImage }) {
  const t = useTranslations("News");
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-border bg-surface-muted">
        <Image
          src={mediaSrc(image.id)}
          alt={image.alt}
          width={image.width}
          height={image.height}
          unoptimized
          priority
          sizes="(min-width: 768px) 768px, 100vw"
          className="h-auto w-full"
        />
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {image.caption ? <span>{image.caption} </span> : null}
        <span>
          {t("imageCredit")}{" "}
          {image.credit_url ? (
            <a
              href={image.credit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {image.credit}
            </a>
          ) : (
            image.credit
          )}
        </span>
      </figcaption>
    </figure>
  );
}
