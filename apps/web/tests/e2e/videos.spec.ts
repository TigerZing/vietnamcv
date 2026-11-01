import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

const SERVER = "http://localhost:8765";
const VIDEOS = ["2026-09-02_Graduateml_1", "2026-09-01_Laskenta_2"].map(
  (base, index) => ({
    file: `${base}.mp4`,
    base,
    title: `Video số ${index + 1}`,
    uploader: "Graduate ML",
    url: "https://www.facebook.com/reel/1",
    has_vi: true,
    has_orig: true,
  }),
);

async function mockServer(page: Page) {
  await page.route(`${SERVER}/api/videos`, (route) =>
    route.fulfill({ json: { videos: VIDEOS } }),
  );
  await page.route(`${SERVER}/api/cues/**`, (route) =>
    route.fulfill({
      json: {
        cues: [{ start: 0, end: 600, orig: "hello", vi: "xin chào" }],
      },
    }),
  );
  await page.route(`${SERVER}/video/**`, (route) => route.abort());
}

test.describe("videos", () => {
  test("explains how to start the server when it is off", async ({ page }) => {
    await page.route(`${SERVER}/**`, (route) => route.abort());
    await page.goto("/vi/videos");
    await expect(page.getByText("xem.sh")).toBeVisible();
    await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  });

  test("is reachable from the navigation", async ({ page, viewport }) => {
    await mockServer(page);
    await page.goto("/vi");
    if ((viewport?.width ?? 1280) < 1024)
      await page.getByRole("button", { name: "Mở menu" }).click();
    await page
      .getByRole("navigation", { name: "Điều hướng chính" })
      .getByRole("link", { name: "Video" })
      .click();
    await expect(page).toHaveURL(/\/vi\/videos/);
    await expect(
      page.getByRole("region", { name: "Video số 1" }),
    ).toBeVisible();
  });

  test("shows the video in 9:16", async ({ page, viewport }) => {
    await mockServer(page);
    await page.goto("/vi/videos");
    const frame = page
      .getByRole("region", { name: "Video số 1" })
      .locator("div")
      .first();
    await expect(frame).toBeVisible();
    const box = (await frame.boundingBox())!;
    if ((viewport?.width ?? 1280) >= 1024) {
      expect(box.width / box.height).toBeCloseTo(9 / 16, 1);
    }
  });

  test("changes text size and speed, and remembers them", async ({ page }) => {
    await mockServer(page);
    await page.goto("/vi/videos");
    const caption = page.getByTestId("video-caption").first();
    await expect(caption).toContainText("xin chào");
    const main = caption.locator("span").first();
    await expect(main).toHaveCSS("font-size", "20px");

    await page.getByRole("button", { name: "Tăng cỡ chữ" }).click();
    await expect(main).toHaveCSS("font-size", "22px");

    const speed = page.getByRole("group", { name: "Tốc độ" });
    await speed.getByRole("button", { name: "1.5x" }).click();
    await expect(speed.getByRole("button", { name: "1.5x" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect
      .poll(() =>
        page
          .locator("video")
          .first()
          .evaluate((v: HTMLVideoElement) => v.playbackRate),
      )
      .toBe(1.5);

    await page.reload();
    await expect(
      page.getByTestId("video-caption").first().locator("span").first(),
    ).toHaveCSS("font-size", "22px");
    await expect(
      page
        .getByRole("group", { name: "Tốc độ" })
        .getByRole("button", { name: "1.5x" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("hides captions when turned off", async ({ page }) => {
    await mockServer(page);
    await page.goto("/vi/videos");
    await expect(page.getByTestId("video-caption").first()).toBeVisible();
    await page.getByLabel("Phụ đề").selectOption("off");
    await expect(page.getByTestId("video-caption")).toHaveCount(0);
  });

  test("likes a video and takes the like back", async ({ page }) => {
    await mockServer(page);
    await page.goto("/vi/videos");
    const slide = page.getByRole("region", { name: "Video số 1" });
    await slide.getByRole("button", { name: "Thích", exact: true }).click();
    const unlike = slide.getByRole("button", { name: "Bỏ thích" });
    await expect(unlike).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await unlike.click();
    await expect(
      slide.getByRole("button", { name: "Thích", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("posts a comment from the panel", async ({ page }) => {
    await mockServer(page);
    await page.goto("/vi/videos");
    const body = `Video này hay quá ${Date.now()}`;
    await page
      .getByRole("region", { name: "Video số 1" })
      .getByRole("button", { name: "Bình luận" })
      .click();
    const panel = page.getByRole("complementary", {
      name: "Bình luận về Video số 1",
    });
    await panel.getByLabel("Nội dung bình luận").fill(body);
    await panel.getByRole("button", { name: "Gửi bình luận" }).click();
    await expect(panel.getByText(body)).toBeVisible();
    await panel.getByRole("button", { name: "Đóng bình luận" }).click();
    await expect(panel).toBeHidden();
  });

  test("does not overflow horizontally", async ({ page }) => {
    await mockServer(page);
    await page.goto("/vi/videos");
    await expect(
      page.getByRole("region", { name: "Video số 1" }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`has no serious accessibility violations (${theme})`, async ({
      page,
    }) => {
      await mockServer(page);
      await page.addInitScript((value) => {
        localStorage.setItem("vietnamcv-theme", value);
      }, theme);
      await page.goto("/vi/videos");
      await expect(
        page.getByRole("region", { name: "Video số 1" }),
      ).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      expect(serious).toEqual([]);
    });
  }
});
