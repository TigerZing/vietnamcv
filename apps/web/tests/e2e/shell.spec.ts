import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("layout shell", () => {
  test("root redirects to the Vietnamese home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/vi$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(
      page.getByRole("heading", { level: 1, name: /Thị giác máy tính/ }),
    ).toBeVisible();
  });

  test("switches to English and keeps the current page", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "covered by desktop project");
    await page.goto("/vi/papers");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/papers$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { level: 1, name: "Papers" }),
    ).toBeVisible();
  });

  test("defaults to the dark theme and remembers the light one", async ({
    page,
  }) => {
    await page.goto("/vi");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page
      .getByRole("button", { name: "Chuyển sang giao diện sáng" })
      .click();
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(
      page.getByRole("button", { name: "Chuyển sang giao diện tối" }),
    ).toBeVisible();
  });

  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/vi");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("navigation works from the keyboard", async ({ page, viewport }) => {
    await page.goto("/vi");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", {
      name: "Chuyển đến nội dung chính",
    });
    await expect(skipLink).toBeFocused();

    if (viewport && viewport.width < 768) {
      const menu = page.getByRole("button", { name: "Mở menu" });
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: "Đóng menu" }),
      ).toHaveAttribute("aria-expanded", "true");
    }
    await page.getByRole("link", { name: "Bài báo" }).first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/vi\/papers$/);
  });

  test("unknown pages return 404", async ({ page }) => {
    const response = await page.goto("/vi/does-not-exist");
    expect(response?.status()).toBe(404);
  });

  for (const [path, theme] of [
    ["/vi", "dark"],
    ["/vi", "light"],
    ["/en", "dark"],
    ["/vi/papers", "dark"],
  ] as const) {
    test(`has no serious accessibility violations on ${path} (${theme})`, async ({
      page,
    }) => {
      await page.addInitScript((value) => {
        localStorage.setItem("vietnamcv-theme", value);
      }, theme);
      await page.goto(path);
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
