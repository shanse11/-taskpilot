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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "signed-test-token", user: testUser }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    fireEvent.change(screen.getByLabelText("邮箱地址"), { target: { value: testUser.email } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "个人资料" })).toBeTruthy());
    expect(window.localStorage.getItem("taskpilot.accessToken")).toBe("signed-test-token");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
      credentials: "include",
      headers: expect.any(Headers),
    }));
  });
});
