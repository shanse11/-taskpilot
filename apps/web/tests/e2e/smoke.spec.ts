import { expect, test } from "@playwright/test";

test("redirects a signed-out visitor to the TaskPilot login page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "TaskPilot 首页" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "登录 TaskPilot" })).toBeVisible();
  await expect(page.getByRole("link", { name: "免费注册" })).toBeVisible();
});
