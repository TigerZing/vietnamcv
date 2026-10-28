import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("discover", () => {
  test("is reachable from the navigation and links picks to their source", async ({
    page,
    viewport,
  }) => {
    await page.goto("/vi");
    if ((viewport?.width ?? 1280) < 1024)
      await page.getByRole("button", { name: "Mở menu" }).click();
    await page
      .getByRole("navigation", { name: "Điều hướng chính" })
      .getByRole("link", { name: "Khám phá" })
      .click();
    await expect(page).toHaveURL(/\/vi\/discover$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Khám phá" }),
    ).toBeVisible();

    const list = page.getByRole("list", { name: "Danh sách mục khám phá" });
    await expect(list.getByRole("article")).toHaveCount(6);
    const link = list.getByRole("link", { name: /^CNN Explainer/ });
    await expect(link).toHaveAttribute(
      "href",
      "https://poloclub.github.io/cnn-explainer/",
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("filters picks by kind", async ({ page }) => {
    await page.goto("/vi/discover");
    const list = page.getByRole("list", { name: "Danh sách mục khám phá" });
    const filter = page.getByRole("region", { name: "Lọc theo loại" });
    await expect(
      filter.getByRole("button", { name: "Tất cả (6)" }),
    ).toHaveAttribute("aria-pressed", "true");

    await filter.getByRole("button", { name: "Bài viết" }).click();
    await expect(list.getByRole("article")).toHaveCount(2);
    await expect(
      filter.getByRole("button", { name: "Bài viết" }),
    ).toHaveAttribute("aria-pressed", "true");

    await filter.getByRole("button", { name: "Tất cả (6)" }).click();
    await expect(list.getByRole("article")).toHaveCount(6);
  });

  test("shows English copy on /en", async ({ page }) => {
    await page.goto("/en/discover");
    await expect(
      page.getByRole("heading", { level: 1, name: "Discover" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^CNN Explainer: watch/ }),
    ).toBeVisible();
  });

  test("does not overflow horizontally", async ({ page }) => {
    await page.goto("/vi/discover");
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
      await page.goto("/vi/discover");
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
