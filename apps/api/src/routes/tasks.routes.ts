import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const tasksRouter = Router();

// All current and future task endpoints are private by default.
tasksRouter.use(requireAuth);
