import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const projectsRouter = Router();

// All current and future project endpoints are private by default.
projectsRouter.use(requireAuth);
