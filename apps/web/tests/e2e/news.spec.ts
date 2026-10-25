import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Runs against tests/e2e/mock-api.mjs (fixture posts, not real news).

test.describe("news", () => {
  test("lists posts with category, source and a video badge", async ({
    page,
  }) => {
    await page.goto("/vi/news");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Tin tức Thị giác máy tính",
      }),
    ).toBeVisible();
    const card = page
      .getByRole("article")
      .filter({ hasText: "Demo post with a video" });
    await expect(card.getByText("Nghiên cứu")).toBeVisible();
    await expect(card.getByText("Có video", { exact: true })).toBeVisible();
    await expect(card.getByText("Demo Source")).toBeVisible();
  });

  test("opens a post with provenance, video and editor note", async ({
    page,
  }) => {
    await page.goto("/vi/news");
    await page.getByRole("link", { name: "Demo post with a video" }).click();
    await expect(page).toHaveURL(/\/vi\/news\/demo-video-post$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Demo post with a video" }),
    ).toBeVisible();
    await expect(page.getByText("Nguồn:").first()).toContainText("Demo Source");
    await expect(
      page.getByText("Dữ liệu mẫu, không phải tin thật."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Đọc bài gốc tại Demo Source/ }),
    ).toHaveAttribute("href", "https://example.com/demo-video-post");

    // The YouTube iframe only loads after pressing play.
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Phát video: Demo video" }).click();
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      /youtube-nocookie\.com\/embed\/abcdefghijk/,
    );
  });

  test("list view is the default and card view picks columns", async ({
    page,
  }, testInfo) => {
    await page.goto("/vi/news");
    const layout = page.getByRole("navigation", { name: "Kiểu hiển thị" });
    await expect(
      layout.getByRole("link", { name: "Danh sách" }),
    ).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("navigation", { name: "Số cột" })).toHaveCount(
      0,
    );

    await layout.getByRole("link", { name: "Thẻ ảnh" }).click();
    await expect(page).toHaveURL(/\/vi\/news\?view=grid$/);
    await expect(layout.getByRole("link", { name: "Thẻ ảnh" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    const columns = page.getByRole("navigation", { name: "Số cột" });
    if (testInfo.project.name === "mobile-360") {
      // Phones always show one column, so the column picker is hidden.
      await expect(columns).toBeHidden();
      return;
    }
    await columns.getByRole("link", { name: "2 cột" }).click();
    await expect(page).toHaveURL(/view=grid&cols=2$/);
    await expect(columns.getByRole("link", { name: "2 cột" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("a post has its image, text, and the source at the end", async ({
    page,
  }) => {
    await page.goto("/vi/news/demo-video-post");
    const image = page.getByRole("img", { name: "Ảnh minh họa bài mẫu" });
    await expect(image).toBeVisible();
    expect(
      await image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
    ).toBe(16);
    await expect(page.getByText("Ảnh: Demo Source")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Điểm chính" }),
    ).toBeVisible();
    await expect(page.getByText("Ý thứ hai")).toBeVisible();
    await expect(page.getByText(/sự hỗ trợ của AI/)).toBeVisible();

    const sources = page.getByRole("region", { name: "Nguồn và liên kết" });
    await expect(
      sources.getByRole("link", { name: /Demo paper/ }),
    ).toHaveAttribute("href", "https://example.com/paper");
    // The source block comes after the article text and before the comments.
    const [text, sourcesTop, commentsTop] = await page.evaluate(() => {
      const top = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().top ?? -1;
      return [
        top("article p.text-lg"),
        top("[aria-labelledby=post-sources]"),
        top("#comments"),
      ] as const;
    });
    expect(text).toBeLessThan(sourcesTop);
    expect(sourcesTop).toBeLessThan(commentsTop);
  });

  test("English pages show the English text", async ({ page }) => {
    await page.goto("/en/news");
    await expect(
      page.getByRole("link", { name: "Demo post with a video (English)" }),
    ).toBeVisible();
    await page.goto("/en/news/demo-video-post");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Demo post with a video (English)",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Opening paragraph of the sample post."),
    ).toBeVisible();

    await page.goto("/en/news/demo-text-post");
    await expect(
      page.getByText("This post is not available in English yet"),
    ).toBeVisible();
  });

  test("stored images are served on the web origin", async ({ request }) => {
    const ok = await request.get(
      "/api/media/00000000-0000-0000-0000-0000000000aa",
    );
    expect(ok.status()).toBe(200);
    expect(ok.headers()["content-type"]).toBe("image/png");
    expect((await request.get("/api/media/not-a-uuid")).status()).toBe(404);
  });

  test("month-only source dates show the month", async ({ page }) => {
    await page.goto("/vi/news/demo-text-post");
    await expect(page.getByText("tháng 10 năm 2026").first()).toBeVisible();
  });

  test("unknown posts show the not-found state", async ({ page }) => {
    await page.goto("/vi/news/does-not-exist");
    await expect(
      page.getByRole("heading", { name: "Không tìm thấy trang" }),
    ).toBeVisible();
  });

  test("posts a comment with a chosen name", async ({ page }) => {
    await page.goto("/vi/news/demo-text-post");
    await page.getByText("Đặt tên", { exact: true }).click();
    await page.getByLabel("Tên hiển thị").fill("Minh Anh");
    const body = `Bài viết hữu ích ${Date.now()}`;
    await page.getByLabel("Nội dung bình luận").fill(body);
    await page.getByRole("button", { name: "Gửi bình luận" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Đã đăng" }),
    ).toBeVisible();
    const comment = page.getByRole("listitem").filter({ hasText: body });
    await expect(comment).toContainText("Minh Anh");
    await expect(comment).toContainText("Khách");
    await expect(page.getByLabel("Nội dung bình luận")).toHaveValue("");
  });

  test("anonymous comment with a link waits for moderation", async ({
    page,
  }) => {
    await page.goto("/vi/news/demo-video-post");
    await page
      .getByLabel("Nội dung bình luận")
      .fill("Xem thêm tại www.example.com");
    await page.getByRole("button", { name: "Gửi bình luận" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "chờ kiểm duyệt" }),
    ).toBeVisible();
  });

  test("Google option is disabled when sign-in is not configured", async ({
    page,
  }) => {
    await page.goto("/vi/news/demo-video-post");
    await expect(
      page.getByRole("radio", { name: "Tài khoản Google" }),
    ).toBeDisabled();
  });

  for (const path of [
    "/vi/news",
    "/vi/news?view=grid&cols=4",
    "/vi/news/demo-video-post",
    "/en/news/demo-video-post",
  ]) {
    test(`has no serious accessibility violations on ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });

    test(`has no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
