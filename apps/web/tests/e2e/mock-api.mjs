// Minimal stand-in for the FastAPI service so e2e tests run without Docker.
// Serves fixture news (not real articles) and keeps posted comments in memory.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_API_PORT ?? 8000);

const news = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "demo-video-post",
    title: "Demo post with a video",
    summary: "Bài viết mẫu dùng cho kiểm thử, có video minh họa.",
    language: "vi",
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
    summary: "Bài viết mẫu thứ hai, không có video.",
    language: "vi",
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
  if (path === "/api/v1/health/live") return send(res, 200, { status: "ok" });
  if (path === "/api/v1/news") {
    const items = news.map((item) => {
      const card = { ...item, comment_count: comments.get(item.slug).length };
      for (const key of ["original_language", "editor_note", "fetched_at"]) {
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
      ...item,
      comment_count: comments.get(item.slug).length,
    });
  }
  notFound(res);
}).listen(port, () => console.log(`mock API on :${port}`));
