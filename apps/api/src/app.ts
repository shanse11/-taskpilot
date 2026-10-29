import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ErrorRequestHandler } from "express";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
const allowedOrigins = new Set([
  "http://localhost:5173",
  process.env.RENDER_EXTERNAL_URL,
  ...(process.env.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
].filter((origin): origin is string => Boolean(origin)));

app.use((request, response, next) => {
  const origin = request.header("origin");
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    response.setHeader("Access-Control-Max-Age", "600");
    response.vary("Origin");
  }
  if (request.method === "OPTIONS") {
    response.status(origin && !allowedOrigins.has(origin) ? 403 : 204).end();
    return;
  }
  next();
});

app.use(express.json());
app.use("/api", apiRouter);

app.use("/api", (request, response) => {
  response.status(404).json({
    error: "not_found",
    message: `No route for ${request.method} ${request.path}`,
  });
});

const webDistDirectory = [
  resolve(process.cwd(), "apps/web/dist"),
  resolve(process.cwd(), "../../apps/web/dist"),
].find((candidate) => existsSync(resolve(candidate, "index.html")));

if (webDistDirectory) {
  app.use(express.static(webDistDirectory, { index: false }));
  app.get(/^\/(?!api(?:\/|$)).*/, (_request, response, next) => {
    response.sendFile(resolve(webDistDirectory, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use((request, response) => {
  response.status(404).json({
    error: "not_found",
    message: `No route for ${request.method} ${request.path}`,
  });
});

const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  console.error("API request failed:", error);
  response.status(500).json({ error: "internal_server_error", message: "An unexpected error occurred" });
};

app.use(errorHandler);
