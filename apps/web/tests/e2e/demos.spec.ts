import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const IMAGE_POST_EMBED =
  "https://www.linkedin.com/embed/feed/update/urn:li:activity:7506375408326733825?compact=1";

test.describe("demos", () => {
  test.beforeEach(async ({ page }) => {
    // Never reach LinkedIn from tests; the player only needs a frame to load.
    await page.route("https://www.linkedin.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<html></html>" }),
    );
  });

  test("lists every demo next to the first one, from the nav", async ({
    page,
    viewport,
  }) => {
    await page.goto("/vi");
    if ((viewport?.width ?? 1280) < 1024)
      await page.getByRole("button", { name: "Mở menu" }).click();
    await page
      .getByRole("navigation", { name: "Điều hướng chính" })
      .getByRole("link", { name: "Sản phẩm demo" })
      .click();
    await expect(page).toHaveURL(/\/vi\/demos$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Sản phẩm demo" }),
    ).toBeVisible();

    const list = page.getByRole("navigation", {
      name: "Danh sách sản phẩm demo",
    });
    await expect(list.getByRole("link")).toHaveCount(19);
    await expect(list.locator("a[aria-current=page]")).toContainText(
      "Đo tốc độ xe",
    );
    await expect(
      page.getByRole("heading", { level: 2, name: /^Đo tốc độ xe/ }),
    ).toBeVisible();
    // Landing on the tab plays nothing and loads no video until a press.
    const video = page.locator("video:visible");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).not.toHaveAttribute("controls", "");
    await expect(page.locator("iframe")).toHaveCount(0);
    await page
      .getByRole("button", { name: /^Phát video: Đo tốc độ xe/ })
      .click();
    await expect(video).toHaveAttribute("src", "/demos/videos/01.mp4");
    await expect(video).toHaveAttribute("controls", "");
    await expect(page).toHaveURL(/\/vi\/demos$/);
  });

  test("choosing a demo plays it on the right with its details", async ({
    page,
  }) => {
    await page.goto("/vi/demos");
    const list = page.getByRole("navigation", {
      name: "Danh sách sản phẩm demo",
    });
    await list.getByRole("link", { name: /HerdSense AI/ }).click();

    await expect(page).toHaveURL(/\/vi\/demos\/03$/);
    // A picked demo starts at once: no play button, the player has its controls.
    const video = page.locator("video:visible");
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute("src", "/demos/videos/03.mp4");
    await expect(video).toHaveAttribute("controls", "");
    await expect(page.getByRole("button", { name: /^Phát video/ })).toHaveCount(
      0,
    );
    await expect(list.locator("a[aria-current=page]")).toContainText(
      "HerdSense AI",
    );
    await expect(
      page.getByRole("heading", { level: 2, name: /^HerdSense AI/ }),
    ).toBeVisible();
    await expect(page.getByText(/đếm bò vào chuồng từ video/)).toBeVisible();
    await expect(page.getByText("Areeba Shahid").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Xem bài viết gốc trên LinkedIn/ }),
    ).toHaveAttribute(
      "href",
      "https://www.linkedin.com/feed/update/urn:li:ugcPost:7519706492808355840/",
    );

    // Another pick swaps the player.
    await list.getByRole("link", { name: /InfiniSplat v2/ }).click();
    await expect(page).toHaveURL(/\/vi\/demos\/08$/);
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute("src", "/demos/videos/08.mp4");
    // The page left behind stays mounted but hidden; its video must be paused.
    const previous = page.locator('video[src="/demos/videos/03.mp4"]');
    if ((await previous.count()) > 0)
      expect(await previous.evaluate((v: HTMLVideoElement) => v.paused)).toBe(
        true,
      );

    // Image posts have no video: they open LinkedIn's post embed instead.
    await list.getByRole("link", { name: /RelateAnything/ }).click();
    await expect(page).toHaveURL(/\/vi\/demos\/13$/);
    await expect(page.locator("iframe:visible")).toHaveAttribute(
      "src",
      IMAGE_POST_EMBED,
    );
  });

  test("credits the maker when someone else posted it", async ({ page }) => {
    await page.goto("/vi/demos/07");
    const credits = page.locator("dl");
    await expect(credits).toContainText("Người làm:");
    await expect(credits).toContainText("Otman Heddouch");
    await expect(credits).toContainText("Computer Vision Store");
  });

  test("viewers can comment on a demo", async ({ page }) => {
    await page.goto("/vi/demos/05");
    const comments = page.locator("#comments");
    await expect(
      comments.getByRole("heading", { name: "Bình luận" }),
    ).toBeVisible();
    const body = `Demo rất hữu ích ${Date.now()}`;
    await comments.getByLabel("Nội dung bình luận").fill(body);
    await comments.getByRole("button", { name: "Gửi bình luận" }).click();
    await expect(comments.getByText(body)).toBeVisible();

    // Each demo has its own thread.
    await page.goto("/vi/demos/06");
    await expect(page.locator("#comments")).toBeVisible();
    await expect(page.getByText(body)).toHaveCount(0);
  });

  test("has English text and a not-found page for unknown demos", async ({
    page,
  }) => {
    await page.goto("/en/demos/01");
    await expect(
      page.getByRole("heading", { level: 1, name: "Demo products" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /^Speed estimation/ }),
    ).toBeVisible();
    await expect(page.getByText("Made by:")).toBeVisible();
    await expect(page.getByText(/becomes a speed camera/)).toBeVisible();

    await page.goto("/en/demos/99");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no serious axe violations or overflow (${theme})`, async ({
      page,
    }) => {
      await page.addInitScript((value) => {
        try {
          localStorage.setItem("vietnamcv-theme", value);
        } catch {}
      }, theme);
      for (const path of ["/vi/demos", "/vi/demos/13"]) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("#comments form")).toBeVisible();
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .exclude("iframe")
          .analyze();
        const serious = results.violations.filter((violation) =>
          ["serious", "critical"].includes(violation.impact ?? ""),
        );
        expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
      }
    });
  }
});
