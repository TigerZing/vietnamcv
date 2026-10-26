import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("roadmap", () => {
  test("is reachable from the navigation", async ({ page, viewport }) => {
    await page.goto("/vi");
    // The desktop nav is hidden below 768px; the burger menu holds the same links.
    if (viewport && viewport.width < 768) {
      await page.getByRole("button", { name: "Mở menu" }).click();
    }
    await page.getByRole("link", { name: "Roadmap" }).first().click();
    await expect(page).toHaveURL(/\/vi\/roadmap$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Lịch sử Computer Vision/,
      }),
    ).toBeVisible();
  });

  test("shows every era and the oldest and newest milestone", async ({
    page,
  }) => {
    await page.goto("/vi/roadmap");
    const timeline = page.getByRole("list", {
      name: "Timeline Computer Vision",
    });
    await expect(timeline.locator("> li")).toHaveCount(6);
    await expect(
      page.getByRole("heading", { name: "Khởi nguyên" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ảnh số đầu tiên" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "VLM mở và embodied vision",
      }),
    ).toBeVisible();
  });

  test("shows why a milestone matters and links to the paper", async ({
    page,
  }) => {
    await page.goto("/vi/roadmap");
    const card = page.locator("article").filter({ hasText: "AlexNet" }).first();
    await expect(card.getByText("Ý nghĩa:")).toBeVisible();
    const source = card.getByRole("link", { name: "Paper gốc" });
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute("href", /^https:\/\//);
  });

  test("jumps to an era from the sticky bar", async ({ page }) => {
    await page.goto("/vi/roadmap");
    await page
      .getByRole("navigation", { name: "Chuyển nhanh tới một giai đoạn" })
      .getByRole("link", { name: /Generative AI & foundation model/ })
      .click();
    await expect(page).toHaveURL(/#era-generative$/);
    await expect(
      page.getByRole("heading", { name: "Generative AI & foundation model" }),
    ).toBeInViewport();
  });

  test("filters milestones by topic", async ({ page }) => {
    await page.goto("/vi/roadmap");
    const filter = page.getByRole("region", { name: "Lọc theo chủ đề" });
    const detection = filter.getByRole("button", { name: "Object detection" });
    await detection.click();
    await expect(detection).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Faster R-CNN" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Canny edge detector" }),
    ).toBeHidden();
    // A second press on the same topic shows everything again.
    await detection.click();
    await expect(detection).toHaveAttribute("aria-pressed", "false");
    await expect(
      page.getByRole("heading", { name: "Canny edge detector" }),
    ).toBeVisible();
  });

  test("has an English translation", async ({ page }) => {
    await page.goto("/en/roadmap");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /The history of computer vision/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Classical vision" }),
    ).toBeVisible();
  });

  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/vi/roadmap");
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
      await page.addInitScript((value) => {
        localStorage.setItem("vietnamcv-theme", value);
      }, theme);
      await page.goto("/vi/roadmap");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? ""),
      );
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }
});
