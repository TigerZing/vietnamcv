import type { Messages } from "next-intl";

/**
 * The history of computer vision as a timeline: structural, language-neutral facts live
 * here (year, era, topic, source link), while every user-facing string lives in
 * `messages/{vi,en}.json` under `Roadmap`. The id types below are derived from the
 * Vietnamese messages, so a milestone or era without copy fails typecheck.
 */

export type EraId = keyof Messages["Roadmap"]["eras"];
export type MilestoneId = keyof Messages["Roadmap"]["milestones"];
export type MilestoneTopic = keyof Messages["Roadmap"]["topics"];
export type IllustrationId = keyof Messages["Roadmap"]["illustrations"];

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
  topic: MilestoneTopic;
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
    topic: "processing",
  },
  {
    id: "perceptron",
    year: 1958,
    era: "origins",
    topic: "foundations",
    source: "https://doi.org/10.1037/h0042519",
  },
  {
    id: "visualCortex",
    year: 1959,
    era: "origins",
    topic: "foundations",
    source: "https://doi.org/10.1113/jphysiol.1959.sp006308",
  },
  {
    id: "houghTransform",
    year: 1962,
    era: "origins",
    topic: "processing",
    source: "https://patents.google.com/patent/US3069654A",
  },
  {
    id: "summerVisionProject",
    year: 1966,
    era: "origins",
    topic: "foundations",
    source: "https://dspace.mit.edu/handle/1721.1/6125",
  },

  // Classical vision: geometry, physics and hand-derived mathematics.
  {
    id: "neocognitron",
    year: 1980,
    era: "classical",
    topic: "recognition",
    source: "https://doi.org/10.1007/BF00344251",
  },
  {
    id: "opticalFlow",
    year: 1981,
    era: "classical",
    topic: "motion",
    source: "https://doi.org/10.1016/0004-3702(81)90024-2",
  },
  {
    id: "ransac",
    year: 1981,
    era: "classical",
    topic: "geometry",
    source: "https://doi.org/10.1145/358669.358692",
  },
  {
    id: "marrVision",
    year: 1982,
    era: "classical",
    topic: "foundations",
    source: "https://mitpress.mit.edu/9780262514620/vision/",
  },
  {
    id: "backpropagation",
    year: 1986,
    era: "classical",
    topic: "foundations",
    source: "https://doi.org/10.1038/323533a0",
  },
  {
    id: "cannyEdges",
    year: 1986,
    era: "classical",
    topic: "processing",
    source: "https://doi.org/10.1109/TPAMI.1986.4767851",
  },
  {
    id: "harrisCorner",
    year: 1988,
    era: "classical",
    topic: "processing",
    source: "https://doi.org/10.5244/C.2.23",
  },
  {
    id: "convNetBackprop",
    year: 1989,
    era: "classical",
    topic: "recognition",
    source: "https://doi.org/10.1162/neco.1989.1.4.541",
  },

  // Hand-crafted features meet statistical learning.
  {
    id: "eigenfaces",
    year: 1991,
    era: "features",
    topic: "people",
    source: "https://doi.org/10.1162/jocn.1991.3.1.71",
  },
  {
    id: "supportVectorMachines",
    year: 1995,
    era: "features",
    topic: "foundations",
    source: "https://doi.org/10.1007/BF00994018",
  },
  {
    id: "lenet5",
    year: 1998,
    era: "features",
    topic: "recognition",
    source: "https://doi.org/10.1109/5.726791",
  },
  {
    id: "sift",
    year: 1999,
    era: "features",
    topic: "processing",
    source: "https://doi.org/10.1109/ICCV.1999.790410",
  },
  {
    id: "violaJones",
    year: 2001,
    era: "features",
    topic: "people",
    source: "https://doi.org/10.1109/CVPR.2001.990517",
  },
  {
    id: "bagOfVisualWords",
    year: 2003,
    era: "features",
    topic: "recognition",
    source: "https://doi.org/10.1109/ICCV.2003.1238663",
  },
  {
    id: "hog",
    year: 2005,
    era: "features",
    topic: "detection",
    source: "https://doi.org/10.1109/CVPR.2005.177",
  },
  {
    id: "pascalVoc",
    year: 2005,
    era: "features",
    topic: "data",
    source: "https://doi.org/10.1007/s11263-009-0275-4",
  },

  // Large datasets plus GPUs turn deep learning into the default method.
  {
    id: "photoTourism",
    year: 2006,
    era: "deep",
    topic: "geometry",
    source: "https://doi.org/10.1145/1141911.1141964",
  },
  {
    id: "imagenet",
    year: 2009,
    era: "deep",
    topic: "data",
    source: "https://doi.org/10.1109/CVPR.2009.5206848",
  },
  {
    id: "alexnet",
    year: 2012,
    era: "deep",
    topic: "recognition",
    source:
      "https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html",
  },
  {
    id: "variationalAutoencoder",
    year: 2013,
    era: "deep",
    topic: "generation",
    source: "https://arxiv.org/abs/1312.6114",
  },
  {
    id: "rcnn",
    year: 2014,
    era: "deep",
    topic: "detection",
    source: "https://arxiv.org/abs/1311.2524",
  },
  {
    id: "gan",
    year: 2014,
    era: "deep",
    topic: "generation",
    source: "https://arxiv.org/abs/1406.2661",
  },
  {
    id: "microsoftCoco",
    year: 2014,
    era: "deep",
    topic: "data",
    source: "https://arxiv.org/abs/1405.0312",
  },
  {
    id: "vggNet",
    year: 2014,
    era: "deep",
    topic: "recognition",
    source: "https://arxiv.org/abs/1409.1556",
  },
  {
    id: "googLeNet",
    year: 2014,
    era: "deep",
    topic: "recognition",
    source: "https://arxiv.org/abs/1409.4842",
  },
  {
    id: "fullyConvolutionalNetworks",
    year: 2014,
    era: "deep",
    topic: "segmentation",
    source: "https://arxiv.org/abs/1411.4038",
  },
  {
    id: "batchNormalization",
    year: 2015,
    era: "deep",
    topic: "foundations",
    source: "https://arxiv.org/abs/1502.03167",
  },
  {
    id: "faceNet",
    year: 2015,
    era: "deep",
    topic: "people",
    source: "https://arxiv.org/abs/1503.03832",
  },
  {
    id: "unet",
    year: 2015,
    era: "deep",
    topic: "segmentation",
    source: "https://arxiv.org/abs/1505.04597",
  },
  {
    id: "fasterRcnn",
    year: 2015,
    era: "deep",
    topic: "detection",
    source: "https://arxiv.org/abs/1506.01497",
  },
  {
    id: "yolo",
    year: 2015,
    era: "deep",
    topic: "detection",
    source: "https://arxiv.org/abs/1506.02640",
  },
  {
    id: "resnet",
    year: 2015,
    era: "deep",
    topic: "recognition",
    source: "https://arxiv.org/abs/1512.03385",
  },

  // Attention, self-supervision and diffusion arrive.
  {
    id: "openPose",
    year: 2016,
    era: "transformer",
    topic: "people",
    source: "https://arxiv.org/abs/1611.08050",
  },
  {
    id: "featurePyramidNetworks",
    year: 2016,
    era: "transformer",
    topic: "detection",
    source: "https://arxiv.org/abs/1612.03144",
  },
  {
    id: "maskRcnn",
    year: 2017,
    era: "transformer",
    topic: "segmentation",
    source: "https://arxiv.org/abs/1703.06870",
  },
  {
    id: "cycleGan",
    year: 2017,
    era: "transformer",
    topic: "generation",
    source: "https://arxiv.org/abs/1703.10593",
  },
  {
    id: "transformerArchitecture",
    year: 2017,
    era: "transformer",
    topic: "foundations",
    source: "https://arxiv.org/abs/1706.03762",
  },
  {
    id: "focalLoss",
    year: 2017,
    era: "transformer",
    topic: "detection",
    source: "https://arxiv.org/abs/1708.02002",
  },
  {
    id: "styleGan",
    year: 2018,
    era: "transformer",
    topic: "generation",
    source: "https://arxiv.org/abs/1812.04948",
  },
  {
    id: "momentumContrast",
    year: 2019,
    era: "transformer",
    topic: "foundations",
    source: "https://arxiv.org/abs/1911.05722",
  },
  {
    id: "nerf",
    year: 2020,
    era: "transformer",
    topic: "geometry",
    source: "https://arxiv.org/abs/2003.08934",
  },
  {
    id: "detr",
    year: 2020,
    era: "transformer",
    topic: "detection",
    source: "https://arxiv.org/abs/2005.12872",
  },
  {
    id: "denoisingDiffusion",
    year: 2020,
    era: "transformer",
    topic: "generation",
    source: "https://arxiv.org/abs/2006.11239",
  },
  {
    id: "visionTransformer",
    year: 2020,
    era: "transformer",
    topic: "recognition",
    source: "https://arxiv.org/abs/2010.11929",
  },
  {
    id: "clip",
    year: 2021,
    era: "transformer",
    topic: "multimodal",
    source: "https://arxiv.org/abs/2103.00020",
  },
  {
    id: "swinTransformer",
    year: 2021,
    era: "transformer",
    topic: "recognition",
    source: "https://arxiv.org/abs/2103.14030",
  },
  {
    id: "dino",
    year: 2021,
    era: "transformer",
    topic: "foundations",
    source: "https://arxiv.org/abs/2104.14294",
  },
  {
    id: "maskedAutoencoders",
    year: 2021,
    era: "transformer",
    topic: "foundations",
    source: "https://arxiv.org/abs/2111.06377",
  },

  // Generation and foundation models.
  {
    id: "latentDiffusion",
    year: 2022,
    era: "generative",
    topic: "generation",
    source: "https://arxiv.org/abs/2112.10752",
  },
  {
    id: "laion5b",
    year: 2022,
    era: "generative",
    topic: "data",
    source: "https://arxiv.org/abs/2210.08402",
  },
  {
    id: "diffusionTransformers",
    year: 2022,
    era: "generative",
    topic: "generation",
    source: "https://arxiv.org/abs/2212.09748",
  },
  {
    id: "controlNet",
    year: 2023,
    era: "generative",
    topic: "generation",
    source: "https://arxiv.org/abs/2302.05543",
  },
  {
    id: "multimodalAssistants",
    year: 2023,
    era: "generative",
    topic: "multimodal",
    source: "https://arxiv.org/abs/2303.08774",
  },
  {
    id: "groundingDino",
    year: 2023,
    era: "generative",
    topic: "detection",
    source: "https://arxiv.org/abs/2303.05499",
  },
  {
    id: "segmentAnything",
    year: 2023,
    era: "generative",
    topic: "segmentation",
    source: "https://arxiv.org/abs/2304.02643",
  },
  {
    id: "dinoV2",
    year: 2023,
    era: "generative",
    topic: "foundations",
    source: "https://arxiv.org/abs/2304.07193",
  },
  {
    id: "rtDetr",
    year: 2023,
    era: "generative",
    topic: "detection",
    source: "https://arxiv.org/abs/2304.08069",
  },
  {
    id: "gaussianSplatting",
    year: 2023,
    era: "generative",
    topic: "geometry",
    source: "https://arxiv.org/abs/2308.04079",
  },
  {
    id: "dust3r",
    year: 2023,
    era: "generative",
    topic: "geometry",
    source: "https://arxiv.org/abs/2312.14132",
  },
  {
    id: "videoGeneration",
    year: 2024,
    era: "generative",
    topic: "generation",
    source: "https://arxiv.org/abs/2311.15127",
  },
  {
    id: "openVisionLanguage",
    year: 2025,
    era: "generative",
    topic: "multimodal",
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

/**
 * Which animated illustration explains each milestone. Several milestones share one when
 * they rest on the same mechanism; the copy for each illustration lives under
 * `Roadmap.illustrations` in the messages.
 */
export const MILESTONE_ILLUSTRATIONS: Record<MilestoneId, IllustrationId> = {
  firstDigitalImage: "pixelScan",
  perceptron: "perceptron",
  visualCortex: "orientationCell",
  houghTransform: "houghVoting",
  summerVisionProject: "pixelMask",
  neocognitron: "convolution",
  opticalFlow: "opticalFlow",
  ransac: "ransac",
  marrVision: "wireframe",
  backpropagation: "backprop",
  cannyEdges: "edgeDetect",
  harrisCorner: "keypoints",
  convNetBackprop: "convolution",
  eigenfaces: "eigenfaces",
  supportVectorMachines: "svmMargin",
  lenet5: "convolution",
  sift: "keypoints",
  violaJones: "slidingWindow",
  bagOfVisualWords: "bagOfWords",
  hog: "slidingWindow",
  pascalVoc: "datasetGrid",
  photoTourism: "multiView",
  imagenet: "datasetGrid",
  alexnet: "convolution",
  variationalAutoencoder: "autoencoder",
  rcnn: "regionProposals",
  gan: "gan",
  microsoftCoco: "datasetGrid",
  vggNet: "convolution",
  googLeNet: "inception",
  fullyConvolutionalNetworks: "pixelMask",
  batchNormalization: "batchNorm",
  faceNet: "faceEmbedding",
  unet: "unet",
  fasterRcnn: "regionProposals",
  yolo: "gridDetection",
  resnet: "residual",
  openPose: "pose",
  featurePyramidNetworks: "pyramid",
  maskRcnn: "instanceMask",
  cycleGan: "imageTranslation",
  transformerArchitecture: "patchAttention",
  focalLoss: "gridDetection",
  styleGan: "gan",
  momentumContrast: "contrastive",
  nerf: "nerfRays",
  detr: "setPrediction",
  denoisingDiffusion: "diffusion",
  visionTransformer: "patchAttention",
  clip: "imageTextMatch",
  swinTransformer: "shiftedWindows",
  dino: "contrastive",
  maskedAutoencoders: "maskedPatches",
  latentDiffusion: "diffusion",
  laion5b: "datasetGrid",
  diffusionTransformers: "diffusion",
  controlNet: "controlNet",
  multimodalAssistants: "visualChat",
  groundingDino: "textGrounding",
  segmentAnything: "promptMask",
  dinoV2: "contrastive",
  rtDetr: "setPrediction",
  gaussianSplatting: "splatting",
  dust3r: "multiView",
  videoGeneration: "videoFrames",
  openVisionLanguage: "visualChat",
};
