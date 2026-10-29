import { expect, test } from "@playwright/test";

test("redirects a signed-out visitor to the TaskPilot login page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "TaskPilot 首页" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "登录 TaskPilot" })).toBeVisible();
  await expect(page.getByRole("link", { name: "免费注册" })).toBeVisible();
});

test("an authenticated visitor can open the dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => window.localStorage.setItem("taskpilot.accessToken", "playwright-test-token"));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("/auth/me")
      ? { user: { id: "playwright-user", email: "pilot@example.com", name: "Avery Chen", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" } }
      : path.endsWith("/dashboard/stats")
        ? { stats: { totalTasks: 2, completedTasks: 1, overdueTasks: 0, completionRate: 50, priorityDistribution: { low: 0, medium: 1, high: 1 }, statusDistribution: { todo: 1, in_progress: 0, done: 1 } } }
        : { projects: [] };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "数据仪表盘" })).toBeVisible();
  await expect(page.getByRole("link", { name: "仪表盘", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "导出 CSV" })).toBeVisible();
  await expect(page.getByRole("region", { name: "按状态分布" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "切换深色主题" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
