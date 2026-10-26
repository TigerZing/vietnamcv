import type { Messages } from "next-intl";

/**
 * The history of computer vision as a timeline: structural, language-neutral facts live
 * here (year, era, kind, source link), while every user-facing string lives in
 * `messages/{vi,en}.json` under `Roadmap`. The id types below are derived from the
 * Vietnamese messages, so a milestone or era without copy fails typecheck.
 */

export type EraId = keyof Messages["Roadmap"]["eras"];
export type MilestoneId = keyof Messages["Roadmap"]["milestones"];
export type MilestoneKind = keyof Messages["Roadmap"]["kinds"];

export type Era = {
  id: EraId;
  /** Inclusive first year of the era; the last era is open-ended. */
  from: number;
  to: number | null;
};

export type Milestone = {
  id: MilestoneId;
  year: number;
  era: EraId;
  kind: MilestoneKind;
  /** Canonical paper, book or archive link. Omitted when no stable public record exists. */
  source?: string;
};

export const ERAS: readonly Era[] = [
  { id: "origins", from: 1957, to: 1969 },
  { id: "classical", from: 1970, to: 1989 },
  { id: "features", from: 1990, to: 2005 },
  { id: "deep", from: 2006, to: 2015 },
  { id: "transformer", from: 2016, to: 2021 },
  { id: "generative", from: 2022, to: null },
];

export const MILESTONES: readonly Milestone[] = [
  // Origins: the first digital images and the first ideas about seeing machines.
  {
    id: "firstDigitalImage",
    year: 1957,
    era: "origins",
    kind: "idea",
  },
  {
    id: "visualCortex",
    year: 1959,
    era: "origins",
    kind: "idea",
    source: "https://doi.org/10.1113/jphysiol.1959.sp006308",
  },
  {
    id: "blocksWorld",
    year: 1963,
    era: "origins",
    kind: "algorithm",
    source: "https://dspace.mit.edu/handle/1721.1/11589",
  },
  {
    id: "summerVisionProject",
    year: 1966,
    era: "origins",
    kind: "idea",
    source: "https://dspace.mit.edu/handle/1721.1/6125",
  },

  // Classical vision: geometry, physics and hand-derived mathematics.
  {
    id: "neocognitron",
    year: 1980,
    era: "classical",
    kind: "model",
    source: "https://doi.org/10.1007/BF00344251",
  },
  {
    id: "opticalFlow",
    year: 1981,
    era: "classical",
    kind: "algorithm",
    source: "https://doi.org/10.1016/0004-3702(81)90024-2",
  },
  {
    id: "marrVision",
    year: 1982,
    era: "classical",
    kind: "idea",
    source: "https://mitpress.mit.edu/9780262514620/vision/",
  },
  {
    id: "backpropagation",
    year: 1986,
    era: "classical",
    kind: "algorithm",
    source: "https://doi.org/10.1038/323533a0",
  },
  {
    id: "cannyEdges",
    year: 1986,
    era: "classical",
    kind: "algorithm",
    source: "https://doi.org/10.1109/TPAMI.1986.4767851",
  },

  // Hand-crafted features meet statistical learning.
  {
    id: "eigenfaces",
    year: 1991,
    era: "features",
    kind: "algorithm",
    source: "https://doi.org/10.1162/jocn.1991.3.1.71",
  },
  {
    id: "lenet5",
    year: 1998,
    era: "features",
    kind: "model",
    source: "https://doi.org/10.1109/5.726791",
  },
  {
    id: "sift",
    year: 1999,
    era: "features",
    kind: "algorithm",
    source: "https://doi.org/10.1109/ICCV.1999.790410",
  },
  {
    id: "violaJones",
    year: 2001,
    era: "features",
    kind: "algorithm",
    source: "https://doi.org/10.1109/CVPR.2001.990517",
  },
  {
    id: "hog",
    year: 2005,
    era: "features",
    kind: "algorithm",
    source: "https://doi.org/10.1109/CVPR.2005.177",
  },
  {
    id: "pascalVoc",
    year: 2005,
    era: "features",
    kind: "dataset",
    source: "https://doi.org/10.1007/s11263-009-0275-4",
  },

  // Large datasets plus GPUs turn deep learning into the default method.
  {
    id: "imagenet",
    year: 2009,
    era: "deep",
    kind: "dataset",
    source: "https://doi.org/10.1109/CVPR.2009.5206848",
  },
  {
    id: "alexnet",
    year: 2012,
    era: "deep",
    kind: "model",
    source:
      "https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html",
  },
  {
    id: "rcnn",
    year: 2014,
    era: "deep",
    kind: "model",
    source: "https://arxiv.org/abs/1311.2524",
  },
  {
    id: "gan",
    year: 2014,
    era: "deep",
    kind: "generative",
    source: "https://arxiv.org/abs/1406.2661",
  },
  {
    id: "unet",
    year: 2015,
    era: "deep",
    kind: "model",
    source: "https://arxiv.org/abs/1505.04597",
  },
  {
    id: "yolo",
    year: 2015,
    era: "deep",
    kind: "model",
    source: "https://arxiv.org/abs/1506.02640",
  },
  {
    id: "resnet",
    year: 2015,
    era: "deep",
    kind: "model",
    source: "https://arxiv.org/abs/1512.03385",
  },

  // Attention replaces convolution as the default building block.
  {
    id: "maskRcnn",
    year: 2017,
    era: "transformer",
    kind: "model",
    source: "https://arxiv.org/abs/1703.06870",
  },
  {
    id: "transformerArchitecture",
    year: 2017,
    era: "transformer",
    kind: "idea",
    source: "https://arxiv.org/abs/1706.03762",
  },
  {
    id: "nerf",
    year: 2020,
    era: "transformer",
    kind: "generative",
    source: "https://arxiv.org/abs/2003.08934",
  },
  {
    id: "detr",
    year: 2020,
    era: "transformer",
    kind: "model",
    source: "https://arxiv.org/abs/2005.12872",
  },
  {
    id: "visionTransformer",
    year: 2020,
    era: "transformer",
    kind: "model",
    source: "https://arxiv.org/abs/2010.11929",
  },
  {
    id: "clip",
    year: 2021,
    era: "transformer",
    kind: "model",
    source: "https://arxiv.org/abs/2103.00020",
  },

  // Generation and foundation models.
  {
    id: "latentDiffusion",
    year: 2022,
    era: "generative",
    kind: "generative",
    source: "https://arxiv.org/abs/2112.10752",
  },
  {
    id: "segmentAnything",
    year: 2023,
    era: "generative",
    kind: "model",
    source: "https://arxiv.org/abs/2304.02643",
  },
  {
    id: "gaussianSplatting",
    year: 2023,
    era: "generative",
    kind: "generative",
    source: "https://arxiv.org/abs/2308.04079",
  },
  {
    id: "multimodalAssistants",
    year: 2023,
    era: "generative",
    kind: "model",
    source: "https://arxiv.org/abs/2303.08774",
  },
  {
    id: "videoGeneration",
    year: 2024,
    era: "generative",
    kind: "generative",
    source: "https://arxiv.org/abs/2311.15127",
  },
  {
    id: "openVisionLanguage",
    year: 2025,
    era: "generative",
    kind: "idea",
  },
];

/** Milestones of one era, oldest first. */
export function milestonesByEra(era: EraId): readonly Milestone[] {
  return MILESTONES.filter((milestone) => milestone.era === era).sort(
    (a, b) => a.year - b.year,
  );
}

/** Years covered by the timeline, from the first milestone to the latest one. */
export function timelineSpan(): { from: number; to: number; years: number } {
  const years = MILESTONES.map((milestone) => milestone.year);
  const from = Math.min(...years);
  const to = Math.max(...years);
  return { from, to, years: to - from + 1 };
}
