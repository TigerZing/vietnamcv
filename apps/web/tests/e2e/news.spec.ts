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
    await expect(page.getByText("Nguồn:")).toContainText("Demo Source");
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

  test("month-only source dates show the month", async ({ page }) => {
    await page.goto("/vi/news/demo-text-post");
    await expect(page.getByText("tháng 10 năm 2026")).toBeVisible();
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

  for (const path of ["/vi/news", "/vi/news/demo-video-post"]) {
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
