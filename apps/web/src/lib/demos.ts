// Shared by server and client components (no server-only imports).

import type { Locale } from "@/i18n/routing";

/**
 * Demo products shown on /demos, curated by the owner in a Google Sheet of LinkedIn
 * posts (ADR-012). Thumbnails in `public/demos/` are frames taken from each post's video
 * (or its image, for `kind: "image"`); playback uses LinkedIn's embed player.
 */
export type Demo = {
  /** Two-digit position in the owner's sheet; also the thumbnail file name. */
  id: string;
  /** LinkedIn update URN: `urn:li:ugcPost:<id>` or `urn:li:activity:<id>`. */
  urn: string;
  kind: "video" | "image";
  author: string;
  title: Record<Locale, string>;
  /** Video length in seconds, when known. */
  duration?: number;
};

export const DEMOS: readonly Demo[] = [
  {
    id: "01",
    urn: "urn:li:ugcPost:7520372769973350400",
    kind: "video",
    author: "Computer Vision Store",
    title: {
      vi: "Đo tốc độ xe từ video giao thông với YOLOv8 + ByteTrack",
      en: "Speed estimation from traffic video with YOLOv8 + ByteTrack",
    },
    duration: 30,
  },
  {
    id: "02",
    urn: "urn:li:ugcPost:7516749503794753536",
    kind: "video",
    author: "Alessandro Ferrari",
    title: {
      vi: "Dense4D: tương ứng 4D dày đặc cho người, quần áo và tóc từ ảnh RGB",
      en: "Dense4D: dense 4D correspondence for body, clothing and hair from RGB",
    },
    duration: 66,
  },
  {
    id: "03",
    urn: "urn:li:ugcPost:7519706492808355840",
    kind: "video",
    author: "Areeba Shahid",
    title: {
      vi: "HerdSense AI: đếm bò vào chuồng với YOLO26 + BoT-SORT",
      en: "HerdSense AI: counting cows entering a barn with YOLO26 + BoT-SORT",
    },
    duration: 12,
  },
  {
    id: "04",
    urn: "urn:li:ugcPost:7518024427263930368",
    kind: "video",
    author: "Kerem Guvelioglu",
    title: {
      vi: "Phân tích quần vợt: theo dõi bóng, gọi bóng trong/ngoài, đo tốc độ cú đánh",
      en: "Tennis analyzer: ball tracking, in/out calls and shot speed",
    },
    duration: 20,
  },
  {
    id: "05",
    urn: "urn:li:ugcPost:7518068722809331712",
    kind: "video",
    author: "Areeba Shahid",
    title: {
      vi: "TrafficEye AI: phát hiện vi phạm mũ bảo hiểm và dây an toàn",
      en: "TrafficEye AI: helmet and seatbelt violation detection",
    },
    duration: 72,
  },
  {
    id: "06",
    urn: "urn:li:ugcPost:7518962117631188992",
    kind: "video",
    author: "Javed Shaik",
    title: {
      vi: "World model cho mô phỏng xe tự hành trung thực đến đâu?",
      en: "How faithful are world models for driving simulation?",
    },
    duration: 58,
  },
  {
    id: "07",
    urn: "urn:li:ugcPost:7518918267059707904",
    kind: "video",
    author: "Computer Vision Store",
    title: {
      vi: "Phân tích trận quần vợt thời gian thực: người chơi, bóng và sân",
      en: "Real-time tennis analysis: players, ball and court",
    },
    duration: 13,
  },
  {
    id: "08",
    urn: "urn:li:ugcPost:7518298679640825857",
    kind: "video",
    author: "Nicolai Nielsen",
    title: {
      vi: "InfiniSplat v2: tái tạo cảnh 3D Gaussian thời gian thực từ nhiều góc nhìn",
      en: "InfiniSplat v2: real-time 3D Gaussian reconstruction from any views",
    },
    duration: 43,
  },
  {
    id: "09",
    urn: "urn:li:ugcPost:7518784168739139584",
    kind: "video",
    author: "Sanket Shah",
    title: {
      vi: "lines-metis: phát hiện đoạn thẳng DeepLSD trên chip Axelera Metis",
      en: "lines-metis: DeepLSD line detection on Axelera Metis",
    },
    duration: 30,
  },
  {
    id: "10",
    urn: "urn:li:activity:7513670993253642240",
    kind: "video",
    author: "Erik Kokalj",
    title: {
      vi: "Kiểm tra chất lượng trứng với OpenAI Decisions API và RF-DETR",
      en: "Egg quality control with the OpenAI Decisions API and RF-DETR",
    },
    duration: 13,
  },
  {
    id: "11",
    urn: "urn:li:activity:7519295119473401856",
    kind: "video",
    author: "Konrad Tkaczyk",
    title: {
      vi: "So sánh 11 bộ theo dõi của OpenCV cho motion capture khuôn mặt",
      en: "Comparing 11 OpenCV trackers for facial motion capture",
    },
    duration: 67,
  },
  {
    id: "12",
    urn: "urn:li:ugcPost:7510926869781970944",
    kind: "video",
    author: "Shah Faisal",
    title: {
      vi: "AI Junction Guard: phát hiện nút giao bị chặn từ video drone 4K",
      en: "AI Junction Guard: flagging blocked junctions from 4K drone footage",
    },
    duration: 26,
  },
  {
    id: "13",
    urn: "urn:li:activity:7506375408326733825",
    kind: "image",
    author: "Joel Nadar",
    title: {
      vi: "RelateAnything: nhận biết quan hệ giữa các vùng ảnh theo thời gian thực",
      en: "RelateAnything: real-time relations between any image regions",
    },
  },
  {
    id: "14",
    urn: "urn:li:activity:7496982021647257602",
    kind: "image",
    author: "Javier Medel",
    title: {
      vi: "4DAnyone: tạo người 4D từ một video quay bình thường",
      en: "4DAnyone: a 4D human from one casual video",
    },
  },
  {
    id: "15",
    urn: "urn:li:activity:7490421004859699200",
    kind: "image",
    author: "Sidhant Tiwari",
    title: {
      vi: "Gán nhãn 3D cho đám mây điểm LiDAR",
      en: "3D annotation of LiDAR point clouds",
    },
  },
  {
    id: "16",
    urn: "urn:li:activity:7489086030323798019",
    kind: "video",
    author: "Alexandre Morgand",
    title: {
      vi: "Axolotl3D (NVIDIA): hoàn thiện hình dạng 3D bám sát phần quan sát được",
      en: "Axolotl3D (NVIDIA): faithful 3D shape completion",
    },
    duration: 20,
  },
  {
    id: "17",
    urn: "urn:li:activity:7488441474380886016",
    kind: "video",
    author: "Ashutosh Shrivastava",
    title: {
      vi: "GNM Head: mô hình 3D tham số của đầu người do Google mở mã nguồn",
      en: "GNM Head: Google's open-source parametric 3D head model",
    },
    duration: 27,
  },
  {
    id: "18",
    urn: "urn:li:activity:7484596663014129665",
    kind: "video",
    author: "Pavlo Tkachenko",
    title: {
      vi: "Khúc côn cầu trên bàn bằng AR với robot Vector",
      en: "AR air hockey against a Vector robot",
    },
    duration: 37,
  },
  {
    id: "19",
    urn: "urn:li:activity:7466129576381816832",
    kind: "video",
    author: "Sofia V.",
    title: {
      vi: "Sửa video bằng câu lệnh: thêm đám đông vào cảnh quay thật",
      en: "Prompt-based video editing: adding a crowd to real footage",
    },
    duration: 20,
  },
];

const URN = /^urn:li:(ugcPost|activity|share):\d{15,25}$/;

export function isLinkedInUrn(urn: string): boolean {
  return URN.test(urn);
}

/** LinkedIn's compact embed: just the media, played inside the card. */
export function demoEmbedUrl(demo: Demo): string {
  return `https://www.linkedin.com/embed/feed/update/${demo.urn}?compact=1`;
}

export function demoPostUrl(demo: Demo): string {
  return `https://www.linkedin.com/feed/update/${demo.urn}/`;
}

export function demoThumbnail(demo: Demo): string {
  return `/demos/${demo.id}.webp`;
}

/** When the post was published: LinkedIn ids carry a millisecond timestamp in their top 41 bits. */
export function demoPublishedAt(demo: Demo): Date {
  const id = demo.urn.slice(demo.urn.lastIndexOf(":") + 1);
  return new Date(Number(BigInt(id) >> BigInt(22)));
}

/** "1:07" style length for the thumbnail badge. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
