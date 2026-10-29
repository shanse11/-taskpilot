import express from "express";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use("/api", apiRouter);

app.use((request, response) => {
  response.status(404).json({
    error: "not_found",
    message: `No route for ${request.method} ${request.path}`,
  });
});
