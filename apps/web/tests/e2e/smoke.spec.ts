import { expect, test } from "@playwright/test";

test("opens the TaskPilot workspace shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "TaskPilot 首页" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /一步一步完成/ })).toBeVisible();
});
