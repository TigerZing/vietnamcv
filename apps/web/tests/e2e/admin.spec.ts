import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// The mock API's fixed account (tests/e2e/mock-api.mjs).
const USERNAME = "admin";
const PASSWORD = "mock-admin-password";
const MOCK_API = "http://localhost:8000";

async function signIn(page: Page, path = "/vi/admin") {
  await page.goto(path);
  await page.getByLabel("Tên đăng nhập").fill(USERNAME);
  await page.getByLabel("Mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Quản trị nội dung" }),
  ).toBeVisible();
}

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("admin", () => {
  test("asks for a login and refuses wrong passwords", async ({ page }) => {
    await page.goto("/vi/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "Đăng nhập quản trị" }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await page.getByLabel("Tên đăng nhập").fill(USERNAME);
    await page.getByLabel("Mật khẩu").fill("wrong-password");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Sai tên đăng nhập hoặc mật khẩu.",
    );
    await expectNoSeriousViolations(page);
  });

  test("signs in with the keyboard, deletes and restores a demo, signs out", async ({
    page,
  }, testInfo) => {
    // The mock API is shared by both viewports running in parallel: one demo each.
    const demo = testInfo.project.name === "desktop" ? "Demo 19" : "Demo 18";
    await page.goto("/vi/admin");
    await page.getByLabel("Tên đăng nhập").focus();
    await page.keyboard.type(USERNAME);
    await page.keyboard.press("Tab");
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { level: 1, name: "Quản trị nội dung" }),
    ).toBeVisible();
    await expect(page.getByText("Demo post with a video")).toBeVisible();

    await page.getByRole("link", { name: "Demo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/admin\?tab=demos$/);
    const row = page.getByRole("listitem").filter({ hasText: demo });
    await row.getByRole("button", { name: `Xoá: ${demo}` }).click();
    // Nothing happens until the second, explicit press; Escape backs out.
    await expect(row.getByText("Xoá thật chứ?")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row.getByText("Xoá thật chứ?")).toHaveCount(0);
    await row.getByRole("button", { name: `Xoá: ${demo}` }).click();
    await row.getByRole("button", { name: `Xoá: ${demo}` }).click();
    await expect(page.getByText(demo)).toHaveCount(0);

    await page.getByRole("link", { name: "Đã xoá" }).click();
    const deleted = page.getByRole("listitem").filter({ hasText: demo });
    await expect(deleted).toBeVisible();
    await expectNoSeriousViolations(page);
    await deleted.getByRole("button", { name: `Khôi phục: ${demo}` }).click();
    await deleted.getByRole("button", { name: `Khôi phục: ${demo}` }).click();
    await expect(page.getByText(demo)).toHaveCount(0);

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Đăng nhập quản trị" }),
    ).toBeVisible();
  });

  test("deletes a comment", async ({ page, request }) => {
    const body = `Bình luận cần xoá ${Date.now()}`;
    const created = await request.post(
      `${MOCK_API}/api/v1/demos/demo-19/comments`,
      { data: { mode: "anonymous", body } },
    );
    expect(created.status()).toBe(201);

    await signIn(page, "/vi/admin?tab=comments");
    const row = page.getByRole("listitem").filter({ hasText: body });
    await expect(row.getByRole("link", { name: "Demo 19" })).toHaveAttribute(
      "href",
      "/vi/demos/19",
    );
    await expectNoSeriousViolations(page);
    await row.getByRole("button", { name: /^Xoá:/ }).click();
    await row.getByRole("button", { name: /^Xoá:/ }).click();
    await expect(page.getByText(body)).toHaveCount(0);
  });

  test("has English text", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(
      page.getByRole("heading", { level: 1, name: "Admin sign-in" }),
    ).toBeVisible();
  });
});
