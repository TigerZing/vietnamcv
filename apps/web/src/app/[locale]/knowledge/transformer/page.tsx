import type { Metadata } from "next";
import { useMessages } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AttentionPlayground } from "@/components/knowledge/attention-playground";
import {
  type ArticleSection,
  TopicArticle,
} from "@/components/knowledge/topic-article";
import type { Locale } from "@/i18n/routing";
import { SECTION_ILLUSTRATIONS } from "@/lib/knowledge";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/knowledge/transformer">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Knowledge.topics.transformer",
  });
  return {
    title: t("name"),
    description: t("summary"),
    alternates: { canonical: `/${locale}/knowledge/transformer` },
  };
}

export default function Page() {
  const sections = useMessages().Knowledge.transformer.sections;
  const articleSections: ArticleSection[] = (
    Object.keys(sections) as (keyof typeof sections)[]
  ).map((id) => ({
    id,
    ...sections[id],
    illustration: SECTION_ILLUSTRATIONS.transformer[id],
  }));

  return (
    <TopicArticle topic="transformer" sections={articleSections}>
      <AttentionPlayground />
    </TopicArticle>
  );
}
