// Shared by server and client components (no server-only imports).

import type { Locale } from "@/i18n/routing";
import type { CommentThread } from "@/lib/comments";

/**
 * Demo products shown on /demos, curated by the owner in a Google Sheet of LinkedIn
 * posts (ADR-012). Thumbnails in `public/demos/` are frames taken from each post's video
 * (or its image, for `kind: "image"`). Videos play from a copy of the clip in
 * `public/demos/videos/` (credited and linked to the post); image posts use LinkedIn's
 * embed player. Comments
 * hang off a published row per demo that `services/api/seed/demos.json` creates; keep
 * the two lists in step (ADR-013).
 */
export type Demo = {
  /** Two-digit position in the owner's sheet; also the thumbnail file name. */
  id: string;
  /** LinkedIn update URN: `urn:li:ugcPost:<id>` or `urn:li:activity:<id>`. */
  urn: string;
  kind: "video" | "image";
  /** Who posted it on LinkedIn. */
  author: string;
  /** Who built it, when that is not the poster (from the post's credits). */
  maker?: string;
  title: Record<Locale, string>;
  /** A few sentences written by the editor from the post. */
  description: Record<Locale, string>;
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
    maker: "Muhammad Haroon Afridi",
    description: {
      vi: "Biến một video giao thông bình thường thành camera đo tốc độ, không cần radar hay cảm biến nào khác. YOLOv8 phát hiện xe, ByteTrack bám từng xe qua các khung hình, còn phép biến đổi homography đưa mặt đường về góc nhìn từ trên xuống để đo quãng đường thật theo mét. Xe vượt tốc độ được tô đỏ, chụp ảnh và ghi vào file CSV.",
      en: "An ordinary traffic video becomes a speed camera, with no radar or extra sensors. YOLOv8 detects vehicles, ByteTrack follows each one across frames, and a homography maps the road to a bird's-eye view so distances are measured in real metres. Speeding vehicles turn red, get a snapshot and are logged to a CSV file.",
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
    maker: "Imperial College London",
    description: {
      vi: "Dense4D là mô hình feed-forward đầu tiên dựng tương ứng 4D dày đặc cho cơ thể, quần áo và tóc từ chuỗi ảnh RGB của một camera, không cần mẫu cơ thể có sẵn. Cơ thể, quần áo và tóc được gộp thành một hình học thống nhất, cho độ chính xác theo dõi cao hơn hẳn các phương pháp trước. Nhóm tác giả cho biết sẽ công bố mã nguồn.",
      en: "Dense4D is the first feed-forward model for dense 4D correspondence across body, clothing and hair from monocular RGB images, without a body template. Body, clothing and hair are merged into one coherent geometry, with much higher tracking accuracy than earlier methods. The authors have announced the code.",
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
    description: {
      vi: "Hệ thống đếm bò vào chuồng từ video trang trại. YOLO26 phát hiện bò, BoT-SORT giữ nguyên mã định danh cho từng con, và vạch đếm chỉ cộng một khi bò đi từ ngoài vào trong, kể cả khi các con đi sát nhau hay khuất vào cửa tối. Kèm bản đồ nhiệt đường đi, bảng số liệu trực tiếp và báo cáo CSV cho từng con.",
      en: "A system that counts cows entering a dairy barn from farm video. YOLO26 detects the cows, BoT-SORT keeps one identity per cow, and an entry line counts each cow once as it crosses inwards, even when cows walk close together or vanish into a dark doorway. It adds a movement heatmap, a live dashboard and a per-cow CSV report.",
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
    description: {
      vi: "Công cụ biến một đoạn video quần vợt khoảng 20 giây thành bản phân tích: theo dõi bóng, gọi bóng trong hay ngoài kèm khoảng cách tính bằng cm, ước tính tốc độ cú đánh, tốc độ và quãng đường của người chơi trên sơ đồ sân. Bóng được bắt bằng mạng heatmap theo thời gian (WASB, backbone HRNet), sân bằng 14 điểm mốc, người chơi bằng YOLO11 kết hợp bộ lọc Kalman.",
      en: "A tool that turns about 20 seconds of tennis into a breakdown: ball tracking, in/out calls with the margin in centimetres, shot speed, and player speed and distance on a mini court. The ball is found by a temporal heatmap network (WASB with an HRNet backbone), the court by 14 keypoints and the players by YOLO11 with a Kalman filter.",
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
    description: {
      vi: "Hệ thống giám sát vi phạm giao thông theo thời gian thực: phát hiện người đi xe máy không đội mũ bảo hiểm và tài xế không thắt dây an toàn từ video đường phố. Mô hình YOLO26 tự huấn luyện với 8 lớp, theo dõi bằng BoT-SORT và Re-ID, cùng cơ chế bỏ phiếu qua nhiều khung hình giúp kết quả ổn định. Mỗi vi phạm được chụp ảnh làm bằng chứng và ghi vào báo cáo CSV.",
      en: "A real-time traffic violation monitor that spots riders without helmets and drivers without seatbelts in road video. A custom-trained 8-class YOLO26 model, BoT-SORT tracking with Re-ID and multi-frame voting keep the decisions stable. Every violation is saved as a snapshot and listed in a CSV report.",
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
    description: {
      vi: "Tái dựng thần kinh chỉ phát lại được đúng chuyến đi đã ghi, trong khi kiểm định xe tự hành cần cả những tình huống chưa từng quay: xe cắt làn, đêm tối gần như không có tầm nhìn, giao thông tốc độ cao. Video so sánh hình ảnh camera do world model dựng, chạy đêm trên cao tốc khoảng một dặm không cắt cảnh, với dữ liệu thật của cùng khung hình.",
      en: "Neural reconstruction can only replay the drive you recorded, but validating autonomous driving needs the drives you could not record: cut-ins, near-zero visibility at night, high-speed traffic. The clip compares a world-model camera, driving about a mile of night highway without a cut, with the ground truth for the same frames.",
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
    maker: "Otman Heddouch",
    description: {
      vi: "Video trận quần vợt được chuyển thành hệ thống phân tích trực quan theo thời gian thực: phát hiện và theo dõi người chơi và bóng, nhận diện 14 điểm mốc của sân bằng ResNet50, rồi chiếu vị trí lên sơ đồ sân theo tỉ lệ kèm số liệu di chuyển và tốc độ. Phù hợp cho huấn luyện, phát sóng và tự động tạo đoạn highlight.",
      en: "Tennis footage becomes a real-time analysis system: players and the ball are detected and tracked, ResNet50 finds 14 court keypoints, and positions are projected onto a scaled court view with movement and speed metrics. Useful for coaching, broadcast graphics and automatic highlights.",
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
    description: {
      vi: "InfiniSplat v2 dựng cảnh 3D Gaussian Splatting từ các góc nhìn bất kỳ, có hoặc không có tư thế camera. Kiến trúc hai nhánh giữ cố định phần hình học và học thuộc tính của các Gaussian, còn độ mờ đục giúp loại bỏ lỗi từ những điểm không nhất quán. Nhờ đó ảnh dựng vẫn tốt khi góc nhìn thay đổi lớn.",
      en: "InfiniSplat v2 reconstructs 3D Gaussian Splatting scenes from arbitrary views, with or without camera poses. A dual-branch architecture freezes the geometry and learns the Gaussian attributes, with opacity suppressing artifacts from inconsistent points, so renders hold up under large viewpoint changes.",
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
    description: {
      vi: "lines-metis chạy mô hình DeepLSD trên chip Axelera AI Metis để trích xuất đoạn thẳng từ ảnh camera, phục vụ ước lượng chuyển động, định vị và dựng bản đồ 3D cho robot. Khung cửa, mép tường và cạnh kết cấu cho thông tin hình học ở nơi ít điểm đặc trưng. Mạng INT8 chạy trên một lõi AIPU, trung bình 27,8 ms mỗi khung hình (khoảng 36 FPS).",
      en: "lines-metis runs DeepLSD on an Axelera AI Metis chip to extract line segments from camera images for motion estimation, localisation and 3D mapping in robotics. Door frames, wall boundaries and structural edges give geometry where point features are sparse. The INT8 network runs on one AIPU core at 27.8 ms per frame on average (about 36 FPS).",
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
    description: {
      vi: "Kiểm tra chất lượng trứng trên băng chuyền: RF-DETR và thư viện trackers của Roboflow phát hiện và theo dõi từng quả, mỗi quả được cắt ảnh gửi tới OpenAI Decisions API để nhận xác suất sạch, bẩn hay nứt. Mỗi quả được kiểm tra ba lần khi lăn và chỉ đạt khi cả ba lần đều sạch. Độ trễ khoảng 270 ms mỗi lần gọi.",
      en: "Egg quality control on a conveyor: Roboflow's RF-DETR and trackers detect and follow each egg, and each crop goes to the OpenAI Decisions API, which returns the probability of clean, dirty or cracked. Every egg is checked three times as it rolls and passes only after three clean results. Each call takes about 270 ms.",
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
    description: {
      vi: "So sánh cả 11 thuật toán theo dõi có sẵn trong OpenCV trên cùng một bài toán: bám các điểm đánh dấu vẽ trên da mặt để quay motion capture 3D. Diễn viên thực hiện hai chuỗi biểu cảm phóng đại. Kết luận: cần nhanh thì chọn MOSSE, cần ổn định thì chọn CSRT, cần thích nghi với vật thể thì chọn ViT; bài báo khoa học sắp được công bố.",
      en: "A comparison of all 11 OpenCV trackers on one task: following markers drawn on skin for 3D facial motion capture. Actors performed two exaggerated sequences. The takeaway: MOSSE for speed, CSRT for stability and ViT for adapting to the object; the paper is coming soon.",
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
    description: {
      vi: "AI Junction Guard biến video drone 4K thành thông tin giao thông, chạy trên một GPU. Người dùng vẽ vùng giám sát trên mặt đường; vùng chuyển từ vàng sang đỏ khi có phương tiện đi vào, kèm số lượng hiện tại và vòng đếm thời gian dừng của từng xe, để phát hiện xe đứng lại làm tắc nút giao.",
      en: "AI Junction Guard turns 4K drone footage into traffic insights on a single GPU. You draw a zone on the road; it turns from yellow to red when road users enter, with live occupancy and a dwell-time ring per vehicle, so a stopped vehicle blocking the junction stands out.",
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
    description: {
      vi: 'RelateAnything nhận một ảnh, một tập vùng bất kỳ và tên các quan hệ dạng văn bản, rồi chấm điểm mọi cặp vùng với mọi quan hệ, chẳng hạn "người cưỡi ngựa". Mô hình 53 triệu tham số, khoảng 20 ms mỗi khung hình, chạy ngay trong trình duyệt và không cần nhãn lớp đối tượng.',
      en: 'RelateAnything takes an image, any set of regions and relation names as text, and scores every region pair against every relation, such as "person riding horse". The 53M-parameter model takes about 20 ms per frame, runs in the browser and needs no object class labels.',
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
    maker: "Ant Group, Zhejiang University",
    description: {
      vi: "4DAnyone biến một video quay bình thường bằng một camera thành mô hình người 4D, không cần dàn camera hay hiệu chỉnh. Quy trình: khôi phục chuyển động 3D của người, sinh các góc nhìn đồng bộ từ nhiều camera ảo, rồi dựng lại người dưới dạng 4D Gaussian Splatting. Khung xương 3D được dùng làm điều kiện để các góc nhìn sinh ra nhất quán với nhau.",
      en: "4DAnyone turns one casual monocular video into a 4D human, with no camera rig or calibration. It recovers the 3D motion, generates synchronised views from many virtual cameras and reconstructs the person as 4D Gaussian Splatting. A 3D skeleton conditions the generation so the views stay consistent.",
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
    description: {
      vi: "Giới thiệu dịch vụ gán nhãn dữ liệu LiDAR cho xe tự hành, ADAS và robot: hộp 3D, phân đoạn đám mây điểm, gán nhãn làn đường, biển báo và đèn tín hiệu, theo dõi đối tượng qua từng khung hình và kết hợp LiDAR với camera.",
      en: "A LiDAR data annotation service for autonomous driving, ADAS and robotics: 3D cuboids, point cloud segmentation, lane, sign and traffic light labels, frame-by-frame object tracking and LiDAR–camera fusion.",
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
    maker: "NVIDIA",
    description: {
      vi: "Axolotl3D hoàn thiện hình dạng 3D mà vẫn bám sát phần hình học đã quan sát được. Mô hình đồng thời dùng ảnh, mặt nạ vùng nhìn thấy, thông số camera và đám mây điểm một phần; đám mây điểm làm mỏ neo hình học, còn thông số camera giữ các góc nhìn thẳng hàng trong cùng một hệ tọa độ.",
      en: "Axolotl3D completes 3D shapes while staying faithful to the geometry that was observed. It conditions on images, visibility masks, camera parameters and partial point clouds; the point cloud anchors the geometry and the cameras keep multiple views aligned in one coordinate system.",
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
    maker: "Google",
    description: {
      vi: "GNM Head là mô hình thống kê 3D tham số của đầu người, thuộc hệ sinh thái Generative aNthropometric Model (GNM) mà Google mở mã nguồn. Mô hình cho điều khiển tách biệt danh tính, biểu cảm và tư thế đầu, có sẵn cấu trúc giải phẫu bên trong và chạy được trên PyTorch, JAX, TensorFlow và NumPy.",
      en: "GNM Head is a parametric 3D statistical model of the human head from Google's open-source Generative aNthropometric Model (GNM) ecosystem. It gives disentangled control over identity, expression and head pose, includes internal anatomy, and runs on PyTorch, JAX, TensorFlow and NumPy.",
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
    description: {
      vi: "Chơi khúc côn cầu trên bàn qua kính AR Snap Spectacles với robot Vector: quả bóng là ảo, thủ môn là robot thật. Dự án mã nguồn mở, ai có robot Vector đều có thể chạy và chơi; tác giả có bài blog chi tiết về cách làm.",
      en: "Air hockey through Snap Spectacles AR glasses against a Vector robot: the puck is virtual, the goalie is real. The project is open source, so anyone with a Vector can run it, and the author wrote a detailed blog post about how it was built.",
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
    description: {
      vi: "AI đang chuyển từ tạo nội dung mới sang chỉnh sửa thực tại: lấy một cảnh quay có sẵn và chỉ thay đổi phần được yêu cầu bằng một câu lệnh, như thêm đám đông, xóa vật thể hay đổi phong cách hình ảnh, trong khi camera, bố cục và bối cảnh vẫn giữ nguyên.",
      en: "AI is moving from generating content to editing reality: take existing footage and change only what a prompt asks for, such as adding a crowd, removing objects or changing the style, while the camera, composition and context stay intact.",
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

/** Our copy of the post's clip, played on the page; image posts have none. */
export function demoVideoUrl(demo: Demo): string | undefined {
  return demo.kind === "video" ? `/demos/videos/${demo.id}.mp4` : undefined;
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

export function findDemo(id: string): Demo | undefined {
  return DEMOS.find((demo) => demo.id === id);
}

/** The demo's comment thread in the API: slug `demo-<id>` (ADR-013). */
export function demoThread(demo: Demo): CommentThread {
  return { kind: "demos", slug: `demo-${demo.id}` };
}
