import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("knowledge", () => {
  test("is reachable from the navigation and lists both topics", async ({
    page,
    viewport,
  }) => {
    await page.goto("/vi");
    if ((viewport?.width ?? 1280) < 1024)
      await page.getByRole("button", { name: "Mở menu" }).click();
    await page
      .getByRole("navigation", { name: "Điều hướng chính" })
      .getByRole("link", { name: "Kiến thức" })
      .click();
    await expect(page).toHaveURL(/\/vi\/knowledge$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Kiến thức" }),
    ).toBeVisible();

    const topics = page.getByRole("list", { name: "Chủ đề kiến thức" });
    await expect(topics.getByRole("listitem")).toHaveCount(2);
    await topics.getByRole("link", { name: /^Transformer và Vision/ }).click();
    await expect(page).toHaveURL(/\/vi\/knowledge\/transformer$/);
  });

  test("mounts the CNN Explainer overview in the page with its credit", async ({
    page,
  }) => {
    await page.goto("/vi/knowledge/cnn");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Convolutional Neural Network (CNN)",
      }),
    ).toBeVisible();
    const explainer = page.getByRole("region", {
      name: "CNN Explainer: mạng CNN tương tác",
    });
    // The network is drawn straight into the page (no iframe) once the model has run.
    await expect(explainer.locator("#cnn-svg rect").first()).toBeAttached({
      timeout: 30_000,
    });
    await expect(explainer).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Giấy phép MIT" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/poloclub/cnn-explainer/blob/master/LICENSE",
    );
    expect((await page.request.get("/cnn-explainer/LICENSE.txt")).ok()).toBe(
      true,
    );

    // A layer name scrolls to the matching Vietnamese section.
    await expect(page.locator("#article-convolution")).toBeAttached();
  });

  test("mounts the convolution hyperparameter playground", async ({ page }) => {
    await page.goto("/vi/knowledge/cnn");
    const playground = page.getByRole("region", {
      name: "Bảng thử siêu tham số của convolution",
    });
    await expect(playground.locator('input[type="range"]')).toHaveCount(4, {
      timeout: 30_000,
    });
    await expect(playground).toHaveAttribute("aria-busy", "false");
  });

  test("keeps the network white and darkens only the playground in dark mode", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("vietnamcv-theme", "dark");
    });
    await page.goto("/vi/knowledge/cnn");
    const roots = page.locator(".cnn-explainer");
    await expect(roots).toHaveCount(2);
    await expect(roots.first()).toHaveCSS("filter", "none");
    await expect(page.locator(".cnn-explainer.follows-theme")).toHaveCSS(
      "filter",
      /invert/,
    );
  });

  test("lists the sections in the contents and jumps to one", async ({
    page,
  }) => {
    await page.goto("/vi/knowledge/cnn");
    const contents = page.getByRole("navigation", { name: "Mục lục" });
    await expect(contents.getByRole("link")).toHaveCount(9);
    await contents.getByRole("link", { name: /Phép convolution/ }).click();
    await expect(page).toHaveURL(/#convolution$/);
    await expect(
      page.getByRole("heading", { level: 2, name: /Phép convolution/ }),
    ).toBeInViewport();
  });

  test("updates attention weights when another patch is the query", async ({
    page,
  }) => {
    await page.goto("/en/knowledge/transformer");
    const grid = page.getByRole("group", {
      name: "Patch grid: pick a patch as the query",
    });
    await expect(grid.getByRole("button")).toHaveCount(16);
    const catQuery = grid.getByRole("button", {
      name: /^Patch row 2, column 2/,
    });
    await expect(catQuery).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/attends most to: cat/)).toBeVisible();

    const sun = grid.getByRole("button", { name: /^Patch row 1, column 4/ });
    await sun.click();
    await expect(sun).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText(/The sun patch at row 1, column 4 attends most to: sun/),
    ).toBeVisible();

    const bias = page.getByRole("switch", { name: /relative position bias/ });
    await bias.click();
    await expect(bias).toHaveAttribute("aria-checked", "true");
  });

  for (const path of [
    "/vi/knowledge",
    "/vi/knowledge/cnn",
    "/vi/knowledge/transformer",
  ]) {
    test(`does not overflow horizontally (${path})`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  for (const theme of ["dark", "light"] as const) {
    for (const path of [
      "/vi/knowledge",
      "/vi/knowledge/cnn",
      "/vi/knowledge/transformer",
    ]) {
      test(`has no serious accessibility violations (${theme}, ${path})`, async ({
        page,
      }) => {
        await page.addInitScript((value) => {
          localStorage.setItem("vietnamcv-theme", value);
        }, theme);
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          // CNN Explainer's own markup is third-party content we keep unmodified.
          .exclude(".cnn-explainer")
          .analyze();
        const serious = results.violations.filter((violation) =>
          ["serious", "critical"].includes(violation.impact ?? ""),
        );
        expect(serious).toEqual([]);
      });
    }
  }
});
