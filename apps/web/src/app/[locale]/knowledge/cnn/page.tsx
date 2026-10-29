import type { Metadata } from "next";
import { useMessages } from "next-intl";
import { getTranslations } from "next-intl/server";

import {
  CnnExplainer,
  CnnHyperparameters,
} from "@/components/knowledge/cnn-explainer";
import {
  type ArticleSection,
  TopicArticle,
} from "@/components/knowledge/topic-article";
import type { Locale } from "@/i18n/routing";
import { CNN_EXPLAINER_ANCHORS, SECTION_ILLUSTRATIONS } from "@/lib/knowledge";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/knowledge/cnn">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Knowledge.topics.cnn",
  });
  return {
    title: t("name"),
    description: t("summary"),
    alternates: { canonical: `/${locale}/knowledge/cnn` },
  };
}

export default function Page() {
  const sections = useMessages().Knowledge.cnn.sections;
  const articleSections: ArticleSection[] = (
    Object.keys(sections) as (keyof typeof sections)[]
  ).map((id) => ({
    id,
    ...sections[id],
    illustration: SECTION_ILLUSTRATIONS.cnn[id],
    anchors: CNN_EXPLAINER_ANCHORS[id],
    interactive: id === "convolution" ? <CnnHyperparameters /> : undefined,
  }));

  return (
    <TopicArticle topic="cnn" sections={articleSections}>
      <CnnExplainer />
    </TopicArticle>
  );
}
