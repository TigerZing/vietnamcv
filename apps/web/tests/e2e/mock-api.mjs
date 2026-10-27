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
    body: "Đoạn mở đầu của bài mẫu.\n\n{{figure:1}}\n\n## Điểm chính\n\n- Ý thứ nhất\n- Ý thứ hai",
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
    figures: [
      {
        id: IMAGE_ID,
        url: `/api/v1/media/${IMAGE_ID}`,
        width: 16,
        height: 9,
        alt: "Hình trong bài mẫu",
        caption: "Chú thích hình trong bài",
        credit: "Demo Lab",
        credit_url: "https://example.com/demo-video-post",
        rights: "permission_pending",
      },
    ],
    links: [
      { kind: "paper", label: "Demo paper", url: "https://example.com/paper" },
    ],
    category: "models-open-source",
    region: "international",
    keywords: ["kiểm thử", "video"],
    tags: ["VLM", "Drone"],
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
    figures: [],
    links: [],
    category: "industrial",
    region: "vietnam",
    keywords: [],
    tags: ["VLM"],
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
// Demo threads, keyed `demo-<id>` like services/api/seed/demos.json.
const demoComments = new Map(
  Array.from({ length: 19 }, (_, i) => [
    `demo-${String(i + 1).padStart(2, "0")}`,
    [],
  ]),
);

// Admin (ADR-015). One fixed account; the token is an unsigned JWT-shaped string the
// web only reads for display. Deletions are kept in `removed` and change the admin lists
// only, so parallel public-page tests never see them; the real API's public effect is
// covered by services/api/tests/integration/test_admin.py.
const ADMIN = { username: "admin", password: "mock-admin-password" };
const ADMIN_TOKEN = [
  { alg: "none", typ: "JWT" },
  { iss: "vietnamcv-admin", name: "admin", exp: 4102444800 },
]
  .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url"))
  .concat("mock")
  .join(".");
const removed = new Set();
const contents = [
  ...news.map((item) => ({
    id: item.id,
    type: "news",
    slug: item.slug,
    title: item.title,
    published_at: item.published_at,
    created_at: item.published_at,
  })),
  ...[...Array(19).keys()].map((i) => {
    const id = String(i + 1).padStart(2, "0");
    return {
      id: `00000000-0000-0000-0000-0000000001${id}`,
      type: "demo",
      slug: `demo-${id}`,
      title: `Demo ${id}`,
      published_at: "2026-10-26T00:00:00Z",
      created_at: "2026-10-26T00:00:00Z",
    };
  }),
];

function adminContent(item) {
  const threads = item.type === "demo" ? demoComments : comments;
  return {
    ...item,
    status: removed.has(item.id) ? "removed" : "published",
    comment_count: threads.get(item.slug).length,
  };
}

function unauthorized(res) {
  send(res, 401, {
    error: {
      code: "UNAUTHENTICATED",
      message: "Authentication required",
      details: {},
      request_id: null,
    },
  });
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || "{}");
}

/** Admin endpoints; returns false when `path` is not one of them. */
async function admin(req, res, url) {
  const path = url.pathname;
  if (!path.startsWith("/api/v1/admin/")) return false;
  if (path === "/api/v1/admin/auth/login" && req.method === "POST") {
    const body = await readJson(req);
    if (body.username !== ADMIN.username || body.password !== ADMIN.password) {
      send(res, 401, {
        error: {
          code: "UNAUTHENTICATED",
          message: "Wrong username or password",
          details: {},
          request_id: null,
        },
      });
      return true;
    }
    send(res, 200, {
      access_token: ADMIN_TOKEN,
      token_type: "bearer",
      expires_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      username: ADMIN.username,
    });
    return true;
  }
  if (req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    unauthorized(res);
    return true;
  }
  if (path === "/api/v1/admin/contents") {
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status") ?? "published";
    const items = contents
      .map(adminContent)
      .filter(
        (item) => (!type || item.type === type) && item.status === status,
      );
    send(res, 200, { items, next_cursor: null });
    return true;
  }
  const contentMatch = path.match(
    /^\/api\/v1\/admin\/contents\/([0-9a-f-]+)(\/restore)?$/,
  );
  if (contentMatch) {
    const item = contents.find((entry) => entry.id === contentMatch[1]);
    if (!item) return (notFound(res), true);
    if (contentMatch[2] && req.method === "POST") {
      removed.delete(item.id);
      send(res, 200, adminContent(item));
    } else {
      removed.add(item.id);
      res.writeHead(204).end();
    }
    return true;
  }
  if (path === "/api/v1/admin/comments") {
    const status = url.searchParams.get("status") ?? "pending";
    const items = contents.flatMap((item) => {
      const threads = item.type === "demo" ? demoComments : comments;
      return threads
        .get(item.slug)
        .filter((comment) => comment.status === status)
        .map((comment) => ({
          ...comment,
          content_id: item.id,
          content_type: item.type,
          content_slug: item.slug,
          content_title: item.title,
        }));
    });
    send(res, 200, { items, next_cursor: null });
    return true;
  }
  const commentMatch = path.match(/^\/api\/v1\/admin\/comments\/([0-9a-f-]+)$/);
  if (commentMatch && req.method === "DELETE") {
    for (const threads of [comments, demoComments]) {
      for (const list of threads.values()) {
        const index = list.findIndex(
          (comment) => comment.id === commentMatch[1],
        );
        if (index >= 0) {
          list.splice(index, 1);
          res.writeHead(204).end();
          return true;
        }
      }
    }
    notFound(res);
    return true;
  }
  notFound(res);
  return true;
}

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
  if (await admin(req, res, url)) return;
  if (path === "/api/v1/demos") {
    return send(res, 200, { items: [...demoComments.keys()] });
  }
  if (path === `/api/v1/media/${IMAGE_ID}`) {
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(PNG);
  }
  if (path === "/api/v1/news/tags") {
    const region = url.searchParams.get("region");
    const counts = new Map();
    for (const item of news) {
      if (region && item.region !== region) continue;
      for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const items = [...counts]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    return send(res, 200, { items });
  }
  if (path === "/api/v1/news") {
    const region = url.searchParams.get("region");
    const tag = url.searchParams.get("tag");
    const matching = news.filter(
      (item) =>
        (!region || item.region === region) &&
        (!tag || item.tags.includes(tag)),
    );
    const items = matching.map((item) => {
      const card = {
        ...localize(item, lang),
        comment_count: comments.get(item.slug).length,
      };
      for (const key of [
        "original_language",
        "editor_note",
        "fetched_at",
        "body",
        "figures",
        "links",
      ]) {
        delete card[key];
      }
      return card;
    });
    return send(res, 200, { items, next_cursor: null });
  }
  const commentsMatch = path.match(
    /^\/api\/v1\/(news|demos)\/([a-z0-9-]+)\/comments$/,
  );
  if (commentsMatch) {
    const threads = commentsMatch[1] === "demos" ? demoComments : comments;
    const list = threads.get(commentsMatch[2]);
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
