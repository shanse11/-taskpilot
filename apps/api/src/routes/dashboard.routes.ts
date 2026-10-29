import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

const querySchema = z.object({ projectId: z.string().trim().min(1).optional() });
const statuses = ["todo", "in_progress", "done"] as const;
const priorities = ["low", "medium", "high"] as const;

function validationError(response: Response, issues: { message: string; path: PropertyKey[] }[]): void {
  response.status(400).json({
    error: "validation_error",
    message: issues[0]?.message ?? "Request is invalid",
    issues: issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

dashboardRouter.get("/stats", async (request: Request, response: Response) => {
  const parsed = querySchema.safeParse({ projectId: request.query.projectId });
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const userId = request.auth!.userId;
  const projectId = parsed.data.projectId;
  if (projectId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
    if (!project) {
      response.status(404).json({ error: "not_found", message: "Project not found" });
      return;
    }
  }

  const where = { userId, ...(projectId ? { projectId } : {}) };
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [statusCounts, priorityCounts, overdueTasks] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.task.groupBy({ by: ["priority"], where, _count: { _all: true } }),
    prisma.task.count({ where: { ...where, status: { not: "done" }, dueDate: { lt: startOfToday } } }),
  ]);

  const statusDistribution: Record<(typeof statuses)[number], number> = { todo: 0, in_progress: 0, done: 0 };
  const priorityDistribution: Record<(typeof priorities)[number], number> = { low: 0, medium: 0, high: 0 };
  for (const item of statusCounts) {
    if (statuses.includes(item.status as (typeof statuses)[number])) {
      statusDistribution[item.status as (typeof statuses)[number]] = item._count._all;
    }
  }
  for (const item of priorityCounts) {
    if (priorities.includes(item.priority as (typeof priorities)[number])) {
      priorityDistribution[item.priority as (typeof priorities)[number]] = item._count._all;
    }
  }

  const totalTasks = statusCounts.reduce((total, item) => total + item._count._all, 0);
  const completedTasks = statusDistribution.done;
  response.json({
    stats: {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 1000) / 10,
      priorityDistribution,
      statusDistribution,
    },
  });
});
