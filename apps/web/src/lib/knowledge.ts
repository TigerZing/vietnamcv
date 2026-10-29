import type { Messages } from "next-intl";

import type { IllustrationId } from "@/lib/roadmap";

/**
 * The Knowledge tab: long-form explanations of the core architectures. Every user-facing
 * string lives in `messages/{vi,en}.json` under `Knowledge`, and sections appear in the
 * order the Vietnamese messages list them. This file holds the language-neutral parts:
 * which topics exist, which roadmap illustration goes with a section, and the sources.
 */

export type TopicId = keyof Messages["Knowledge"]["topics"];
type CnnSectionId = keyof Messages["Knowledge"]["cnn"]["sections"];
type TransformerSectionId =
  keyof Messages["Knowledge"]["transformer"]["sections"];

export type Topic = {
  id: TopicId;
  href: `/knowledge/${TopicId}`;
  /** Theme hue (a roadmap era colour) used for the topic's accents. */
  hue: string;
  /** The roadmap illustration shown on the topic card. */
  cover: IllustrationId;
};

export const TOPICS: readonly Topic[] = [
  {
    id: "cnn",
    href: "/knowledge/cnn",
    hue: "var(--era-deep)",
    cover: "convolution",
  },
  {
    id: "transformer",
    href: "/knowledge/transformer",
    hue: "var(--era-transformer)",
    cover: "patchAttention",
  },
];

/** Roadmap illustrations reused next to a section; sections without one have none. */
export const SECTION_ILLUSTRATIONS: {
  cnn: Partial<Record<CnnSectionId, IllustrationId>>;
  transformer: Partial<Record<TransformerSectionId, IllustrationId>>;
} = {
  cnn: {
    convolution: "convolution",
    hierarchy: "saliencyHeatmap",
    training: "backprop",
    architectures: "residual",
    tasks: "gridDetection",
  },
  transformer: {
    tokens: "patchAttention",
    block: "residual",
    variants: "shiftedWindows",
  },
};

/**
 * Element ids CNN Explainer scrolls to when a layer name is clicked ("move to article
 * section"), placed on the CNN sections that explain those layers.
 */
export const CNN_EXPLAINER_ANCHORS: Partial<Record<CnnSectionId, string[]>> = {
  why: ["article-input"],
  convolution: ["article-convolution"],
  activation: ["article-relu"],
  pooling: ["article-pooling"],
  head: ["article-flatten", "article-softmax"],
};

export type Reference = {
  /** Citation as published (titles are not translated). */
  title: string;
  authors: string;
  year: number;
  url: string;
};

export const REFERENCES: Record<TopicId, readonly Reference[]> = {
  cnn: [
    {
      title:
        "CNN Explainer: Learning Convolutional Neural Networks with Interactive Visualization",
      authors: "Wang, Turko, Shaikh, Park, Das, Hohman, Kahng, Chau",
      year: 2020,
      url: "https://arxiv.org/abs/2004.15004",
    },
    {
      title: "Gradient-Based Learning Applied to Document Recognition",
      authors: "LeCun, Bottou, Bengio, Haffner",
      year: 1998,
      url: "https://doi.org/10.1109/5.726791",
    },
    {
      title: "ImageNet Classification with Deep Convolutional Neural Networks",
      authors: "Krizhevsky, Sutskever, Hinton",
      year: 2012,
      url: "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
    },
    {
      title: "Visualizing and Understanding Convolutional Networks",
      authors: "Zeiler, Fergus",
      year: 2013,
      url: "https://arxiv.org/abs/1311.2901",
    },
    {
      title:
        "Very Deep Convolutional Networks for Large-Scale Image Recognition",
      authors: "Simonyan, Zisserman",
      year: 2014,
      url: "https://arxiv.org/abs/1409.1556",
    },
    {
      title: "Deep Residual Learning for Image Recognition",
      authors: "He, Zhang, Ren, Sun",
      year: 2015,
      url: "https://arxiv.org/abs/1512.03385",
    },
    {
      title: "A guide to convolution arithmetic for deep learning",
      authors: "Dumoulin, Visin",
      year: 2016,
      url: "https://arxiv.org/abs/1603.07285",
    },
    {
      title: "A ConvNet for the 2020s",
      authors: "Liu, Mao, Wu, Feichtenhofer, Darrell, Xie",
      year: 2022,
      url: "https://arxiv.org/abs/2201.03545",
    },
    {
      title: "CS231n: Convolutional Neural Networks for Visual Recognition",
      authors: "Stanford University",
      year: 2017,
      url: "https://cs231n.github.io/convolutional-networks/",
    },
  ],
  transformer: [
    {
      title: "Attention Is All You Need",
      authors:
        "Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin",
      year: 2017,
      url: "https://arxiv.org/abs/1706.03762",
    },
    {
      title:
        "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
      authors: "Dosovitskiy et al.",
      year: 2020,
      url: "https://arxiv.org/abs/2010.11929",
    },
    {
      title: "End-to-End Object Detection with Transformers",
      authors: "Carion et al.",
      year: 2020,
      url: "https://arxiv.org/abs/2005.12872",
    },
    {
      title:
        "Training data-efficient image transformers & distillation through attention",
      authors: "Touvron et al.",
      year: 2021,
      url: "https://arxiv.org/abs/2012.12877",
    },
    {
      title:
        "Swin Transformer: Hierarchical Vision Transformer using Shifted Windows",
      authors: "Liu et al.",
      year: 2021,
      url: "https://arxiv.org/abs/2103.14030",
    },
    {
      title:
        "Learning Transferable Visual Models From Natural Language Supervision",
      authors: "Radford et al.",
      year: 2021,
      url: "https://arxiv.org/abs/2103.00020",
    },
    {
      title: "Masked Autoencoders Are Scalable Vision Learners",
      authors: "He et al.",
      year: 2021,
      url: "https://arxiv.org/abs/2111.06377",
    },
    {
      title:
        "Transformer Explainer: Interactive Learning of Text-Generative Models",
      authors: "Cho et al.",
      year: 2024,
      url: "https://poloclub.github.io/transformer-explainer/",
    },
    {
      title: "The Illustrated Transformer",
      authors: "Jay Alammar",
      year: 2018,
      url: "https://jalammar.github.io/illustrated-transformer/",
    },
  ],
};

/**
 * The CNN Explainer overview built by `tools/cnn-explainer/build.sh` into
 * `public/cnn-explainer`, and its upstream. Scripts load in order: the embed expects d3,
 * TensorFlow.js and Font Awesome as globals.
 */
export const CNN_EXPLAINER = {
  stylesheet: "/cnn-explainer/embed.css",
  scripts: [
    "/cnn-explainer/vendor/d3-5.16.0.min.js",
    "/cnn-explainer/vendor/tfjs-1.0.0.min.js",
    "/cnn-explainer/vendor/fontawesome-5.3.1.min.js",
    "/cnn-explainer/embed.js",
  ],
  original: "https://poloclub.github.io/cnn-explainer/",
  source: "https://github.com/poloclub/cnn-explainer",
  license: "https://github.com/poloclub/cnn-explainer/blob/master/LICENSE",
  paper: "https://arxiv.org/abs/2004.15004",
} as const;

export type BodyBlock =
  { kind: "paragraph"; text: string } | { kind: "list"; items: string[] };

/**
 * Splits a section body into blocks: paragraphs are separated by a blank line, and lines
 * starting with "- " are list items; a run of them becomes a bulleted list, so a list may
 * follow its lead-in sentence directly.
 */
export function bodyBlocks(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  for (const chunk of body.split(/\n\s*\n/)) {
    let text: string[] = [];
    let items: string[] = [];
    const flush = () => {
      if (text.length) blocks.push({ kind: "paragraph", text: text.join(" ") });
      if (items.length) blocks.push({ kind: "list", items });
      text = [];
      items = [];
    };
    for (const line of chunk.split("\n").map((value) => value.trim())) {
      if (!line) continue;
      if (line.startsWith("- ")) {
        if (text.length) {
          blocks.push({ kind: "paragraph", text: text.join(" ") });
          text = [];
        }
        items.push(line.slice(2).trim());
      } else {
        if (items.length) flush();
        text.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/** Neighbouring topic for the "next topic" link, wrapping around. */
export function nextTopic(id: TopicId): Topic {
  const index = TOPICS.findIndex((topic) => topic.id === id);
  return TOPICS[(index + 1) % TOPICS.length] as Topic;
}
