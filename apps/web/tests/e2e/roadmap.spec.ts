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

  test("opens the illustration on the side opposite the card", async ({
    page,
    viewport,
  }) => {
    test.skip(
      !viewport || viewport.width < 1024,
      "the side panel only exists in the two-column layout",
    );
    await page.goto("/vi/roadmap");
    for (const name of ["AlexNet", "Faster R-CNN"]) {
      const card = page.locator("article").filter({ hasText: name }).first();
      const button = card.getByRole("button", { name: /minh hoạ$/ });
      await card.hover();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      const panelId = await button.getAttribute("aria-controls");
      const panel = page.locator(`[id="${panelId}"]`);
      await expect(panel).toBeVisible();
      await expect(panel).toContainText("Cách hoạt động");
      const cardBox = (await card.boundingBox())!;
      const panelBox = (await panel.boundingBox())!;
      const cardOnLeft = cardBox.x + cardBox.width / 2 < viewport!.width / 2;
      if (cardOnLeft) {
        expect(panelBox.x).toBeGreaterThanOrEqual(cardBox.x + cardBox.width);
      } else {
        expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(cardBox.x);
      }
      // Escape dismisses it without moving the pointer.
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await page.mouse.move(0, 0);
    }
  });

  test("shows the illustration under the card from its button", async ({
    page,
  }) => {
    await page.goto("/vi/roadmap");
    const card = page.locator("article").filter({ hasText: "NeRF" }).first();
    const show = card.getByRole("button", { name: "Xem minh hoạ" });
    await show.click();
    const hide = card.getByRole("button", { name: "Ẩn minh hoạ" });
    await expect(hide).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator(
      `[id="${await hide.getAttribute("aria-controls")}"]`,
    );
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("NeRF");
    await hide.click();
    await expect(panel).toBeHidden();
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

  test("shows the major milestones by default and every one on request", async ({
    page,
  }) => {
    await page.goto("/vi/roadmap");
    const scope = page.getByRole("region", { name: "Hiển thị" });
    const major = scope.getByRole("button", { name: /^Mốc chính/ });
    const all = scope.getByRole("button", { name: /^Tất cả các mốc/ });
    await expect(major).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "AlexNet" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Kalman filter" }),
    ).toBeHidden();
    await all.click();
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Kalman filter" }),
    ).toBeVisible();
    // In the full timeline the major milestones carry a badge.
    const card = page.locator("article").filter({ hasText: "AlexNet" }).first();
    await expect(card.getByText("Mốc chính", { exact: true })).toBeVisible();
    await major.click();
    await expect(
      page.getByRole("heading", { name: "Kalman filter" }),
    ).toBeHidden();
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
      // Audit the full timeline, with its major-milestone badges and an illustration open.
      await page
        .getByRole("region", { name: "Hiển thị" })
        .getByRole("button", { name: /^Tất cả các mốc/ })
        .click();
      await page
        .locator("article")
        .filter({ hasText: "AlexNet" })
        .first()
        .getByRole("button", { name: "Xem minh hoạ" })
        .click();
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
