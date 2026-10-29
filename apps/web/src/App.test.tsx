import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const testUser = {
  id: "user_test_1",
  email: "pilot@example.com",
  name: "Avery Chen",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("authentication screens", () => {
  it("redirects the protected workspace to login and links to registration", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "登录 TaskPilot" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "免费注册" }).getAttribute("href")).toBe("/register");
  });

  it("logs in, stores the Bearer token, and opens the protected profile", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const path = String(input);
      const data = path.endsWith("/auth/login")
        ? { token: "signed-test-token", user: testUser }
        : { projects: [] };
      return Promise.resolve({ ok: true, status: 200, json: async () => data } as Response);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    fireEvent.change(screen.getByLabelText("邮箱地址"), { target: { value: testUser.email } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "项目" })).toBeTruthy());
    expect(window.localStorage.getItem("taskpilot.accessToken")).toBe("signed-test-token");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
      credentials: "include",
      headers: expect.any(Headers),
    }));
  });

  it("opens the dashboard for an authenticated user and renders task statistics", async () => {
    window.localStorage.setItem("taskpilot.accessToken", "signed-test-token");
    window.history.replaceState({}, "", "/dashboard");
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const path = String(input);
      const data = path.endsWith("/auth/me")
        ? { user: testUser }
        : path.includes("/dashboard/stats")
          ? { stats: { totalTasks: 4, completedTasks: 1, overdueTasks: 1, completionRate: 25, priorityDistribution: { low: 1, medium: 2, high: 1 }, statusDistribution: { todo: 2, in_progress: 1, done: 1 } } }
          : { projects: [] };
      return Promise.resolve({ ok: true, status: 200, json: async () => data, blob: async () => new Blob() } as Response);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "数据仪表盘" })).toBeTruthy());
    await waitFor(() => expect(screen.getByText("任务总数")).toBeTruthy());
    expect(screen.getByRole("region", { name: "按状态分布" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard/stats", expect.objectContaining({
      headers: expect.any(Headers),
    }));
  });
});
