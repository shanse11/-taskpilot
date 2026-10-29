import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("GET /api/health", () => {
  it("returns the API health payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "taskpilot-api" });
    expect(response.headers["strict-transport-security"]).toBeUndefined();
  });

  it("sets security headers and allows the production custom domain", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://task.shanse.dev")
      .set("x-forwarded-proto", "https");

    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response.headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(response.headers["content-security-policy"]).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    );
    expect(response.headers["strict-transport-security"]).toBe("max-age=31536000; includeSubDomains");
    expect(response.headers["access-control-allow-origin"]).toBe("https://task.shanse.dev");
  });
});
