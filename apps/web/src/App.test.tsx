import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("TaskPilot home screen", () => {
  it("shows the initial workspace shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /一步一步完成/ })).toBeTruthy();
    expect(screen.getByRole("region", { name: "任务概览" })).toBeTruthy();
  });
});
