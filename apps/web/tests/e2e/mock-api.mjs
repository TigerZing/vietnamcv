// Minimal stand-in for the FastAPI service so e2e tests run without Docker.
// Serves fixture news (not real articles) and keeps posted comments in memory.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_API_PORT ?? 8000);

// A 16x9 PNG served for every stored image.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAIAAAC0SDtlAAAAF0lEQVR4nGOUqzjBQApgIkn1qAZaaQAAaOABcFAmbecAAAAASUVORK5CYII=",
  "base64",
);
const IMAGE_ID = "00000000-0000-0000-0000-0000000000aa";

const news = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "demo-video-post",
    title: "Demo post with a video",
    original_title: "Demo post with a video",
    summary: "Bài viết mẫu dùng cho kiểm thử, có video minh họa.",
    body: "Đoạn mở đầu của bài mẫu.\n\n## Điểm chính\n\n- Ý thứ nhất\n- Ý thứ hai",
    text_en: {
      title: "Demo post with a video (English)",
      summary: "A sample post for tests, with a video.",
      body: "Opening paragraph of the sample post.",
    },
    language: "vi",
    ai_assisted: true,
    image: {
      id: IMAGE_ID,
      url: `/api/v1/media/${IMAGE_ID}`,
      width: 16,
      height: 9,
      alt: "Ảnh minh họa bài mẫu",
      caption: null,
      credit: "Demo Source",
      credit_url: "https://example.com/demo-video-post",
      rights: "permission_pending",
    },
    links: [
      { kind: "paper", label: "Demo paper", url: "https://example.com/paper" },
    ],
    category: "research",
    region: "international",
    keywords: ["kiểm thử", "video"],
    published_at: "2026-10-25T08:00:00Z",
    source: {
      name: "Demo Source",
      url: "https://example.com/demo-video-post",
      published_on: "2026-10-20",
      published_precision: "day",
    },
    video: { provider: "youtube", id: "abcdefghijk", title: "Demo video" },
    comment_count: 0,
    original_language: "en",
    editor_note: "Dữ liệu mẫu, không phải tin thật.",
    fetched_at: "2026-10-25T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "demo-text-post",
    title: "Bài mẫu chỉ có chữ",
    original_title: "Bài mẫu chỉ có chữ",
    summary: "Bài viết mẫu thứ hai, không có video.",
    body: null,
    text_en: null,
    language: "vi",
    ai_assisted: false,
    image: null,
    links: [],
    category: "industrial",
    region: "vietnam",
    keywords: [],
    published_at: "2026-10-24T08:00:00Z",
    source: {
      name: "Nguồn mẫu",
      url: "https://example.com/demo-text-post",
      published_on: "2026-10-01",
      published_precision: "month",
    },
    video: null,
    comment_count: 0,
    original_language: "vi",
    editor_note: null,
    fetched_at: "2026-10-25T00:00:00Z",
  },
];
const comments = new Map(news.map((item) => [item.slug, []]));

/** The post as the API returns it in `lang`, falling back to Vietnamese. */
function localize(item, lang) {
  const { text_en: english, ...post } = item;
  if (lang === "en" && english) return { ...post, ...english, language: "en" };
  return post;
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function notFound(res) {
  send(res, 404, {
    error: {
      code: "NOT_FOUND",
      message: "Not found",
      details: {},
      request_id: null,
    },
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const path = url.pathname;
  const lang = url.searchParams.get("lang") ?? "vi";
  if (path === "/api/v1/health/live") return send(res, 200, { status: "ok" });
  if (path === `/api/v1/media/${IMAGE_ID}`) {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(PNG);
  }
  if (path === "/api/v1/news") {
    const items = news.map((item) => {
      const card = {
        ...localize(item, lang),
        comment_count: comments.get(item.slug).length,
      };
      for (const key of [
        "original_language",
        "editor_note",
        "fetched_at",
        "body",
        "links",
      ]) {
        delete card[key];
      }
      return card;
    });
    return send(res, 200, { items, next_cursor: null });
  }
  const commentsMatch = path.match(/^\/api\/v1\/news\/([a-z0-9-]+)\/comments$/);
  if (commentsMatch) {
    const list = comments.get(commentsMatch[1]);
    if (!list) return notFound(res);
    if (req.method === "POST") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      const comment = {
        id: crypto.randomUUID(),
        author: {
          kind: body.mode,
          name: body.mode === "guest" ? body.display_name : null,
          avatar_url: null,
          verified: false,
        },
        body: body.body.trim(),
        status: /https?:\/\/|www\./.test(body.body) ? "pending" : "published",
        created_at: new Date().toISOString(),
      };
      if (comment.status === "published") list.unshift(comment);
      return send(res, 201, comment);
    }
    return send(res, 200, { items: list, next_cursor: null });
  }
  const detailMatch = path.match(/^\/api\/v1\/news\/([a-z0-9-]+)$/);
  if (detailMatch) {
    const item = news.find((entry) => entry.slug === detailMatch[1]);
    if (!item) return notFound(res);
    return send(res, 200, {
      ...localize(item, lang),
      comment_count: comments.get(item.slug).length,
    });
  }
  notFound(res);
}).listen(port, () => console.log(`mock API on :${port}`));
