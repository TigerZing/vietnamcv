import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("demos", () => {
  test.beforeEach(async ({ page }) => {
    // Never reach LinkedIn from tests; the player only needs a frame to load.
    await page.route("https://www.linkedin.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<html></html>" }),
    );
  });

  test("shows a grid of demo cards from the nav", async ({
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
    await expect(page.getByRole("article")).toHaveCount(19);
    // Nothing loads from LinkedIn before a viewer presses play.
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("plays a video inside its card without leaving the page", async ({
    page,
  }) => {
    await page.goto("/vi/demos");
    const card = page
      .getByRole("article")
      .filter({ hasText: "Đo tốc độ xe từ video giao thông" });
    await card
      .getByRole("button", { name: /^Phát video: Đo tốc độ xe/ })
      .click();

    const player = card.locator("iframe");
    await expect(player).toHaveAttribute(
      "src",
      "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7520372769973350400?compact=1",
    );
    await expect(page).toHaveURL(/\/vi\/demos$/);
    await expect(page.locator("iframe")).toHaveCount(1);

    // Playing another demo stops the first one.
    const other = page.getByRole("article").filter({ hasText: "HerdSense AI" });
    await other.getByRole("button", { name: /^Phát video: HerdSense/ }).click();
    await expect(page.locator("iframe")).toHaveCount(1);
    await expect(other.locator("iframe")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("iframe")).toHaveCount(0);

    await card
      .getByRole("button", { name: /^Phát video: Đo tốc độ xe/ })
      .click();
    await card.getByRole("button", { name: /^Đóng:/ }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("has English titles and a link to the post", async ({ page }) => {
    await page.goto("/en/demos");
    await expect(
      page.getByRole("heading", { level: 1, name: "Demo products" }),
    ).toBeVisible();
    const card = page
      .getByRole("article")
      .filter({ hasText: "Speed estimation from traffic video" });
    await expect(
      card.getByRole("link", { name: /View on LinkedIn/ }),
    ).toHaveAttribute(
      "href",
      "https://www.linkedin.com/feed/update/urn:li:ugcPost:7520372769973350400/",
    );
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
      await page.goto("/vi/demos");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
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
