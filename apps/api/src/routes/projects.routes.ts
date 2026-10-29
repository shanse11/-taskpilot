import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { projectTasksRouter } from "./tasks.routes.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);
projectsRouter.use("/:projectId/tasks", projectTasksRouter);

const projectStatusSchema = z.enum(["active", "archived"]);
const projectFields = {
  name: z.string().trim().min(1, "Project name is required").max(120),
  description: z.string().trim().max(5000).nullable(),
  status: projectStatusSchema,
};
const createProjectSchema = z.object(projectFields).partial({ description: true, status: true }).strict();
const updateProjectSchema = z.object(projectFields).partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one project field to update",
});

function validationError(response: Response, issues: { message: string; path: PropertyKey[] }[]): void {
  response.status(400).json({
    error: "validation_error",
    message: issues[0]?.message ?? "Request is invalid",
    issues: issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

function notFound(response: Response): void {
  response.status(404).json({ error: "not_found", message: "Project not found" });
}

function routeParam(request: Request, key: string): string {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

projectsRouter.get("/", async (request: Request, response: Response) => {
  const rawStatus = request.query.status;
  let status: "active" | "archived" | undefined;
  if (rawStatus !== undefined) {
    const parsed = projectStatusSchema.safeParse(rawStatus);
    if (!parsed.success) {
      validationError(response, parsed.error.issues);
      return;
    }
    status = parsed.data;
  }

  const projects = await prisma.project.findMany({
    where: { userId: request.auth!.userId, ...(status ? { status } : {}) },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { tasks: true } } },
  });
  response.json({ projects });
});

projectsRouter.post("/", async (request: Request, response: Response) => {
  const parsed = createProjectSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const project = await prisma.project.create({
    data: {
      userId: request.auth!.userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      status: parsed.data.status ?? "active",
    },
    include: { _count: { select: { tasks: true } } },
  });
  response.status(201).json({ project });
});

projectsRouter.get("/:id", async (request: Request, response: Response) => {
  const userId = request.auth!.userId;
  const id = routeParam(request, "id");
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!project) {
    notFound(response);
    return;
  }

  const counts = await prisma.task.groupBy({
    by: ["status"],
    where: { projectId: project.id, userId },
    _count: { _all: true },
  });
  const taskSummary = { total: counts.reduce((total, count) => total + count._count._all, 0), todo: 0, in_progress: 0, done: 0 };
  for (const count of counts) {
    if (count.status === "todo" || count.status === "in_progress" || count.status === "done") {
      taskSummary[count.status] = count._count._all;
    }
  }
  response.json({ project, taskSummary });
});

projectsRouter.patch("/:id", async (request: Request, response: Response) => {
  const parsed = updateProjectSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const existing = await prisma.project.findFirst({ where: { id: routeParam(request, "id"), userId: request.auth!.userId }, select: { id: true } });
  if (!existing) {
    notFound(response);
    return;
  }

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: parsed.data,
    include: { _count: { select: { tasks: true } } },
  });
  response.json({ project });
});

projectsRouter.delete("/:id", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userId = request.auth!.userId;
    const existing = await prisma.project.findFirst({ where: { id: routeParam(request, "id"), userId }, select: { id: true } });
    if (!existing) {
      notFound(response);
      return;
    }

    await prisma.$transaction([
      prisma.task.deleteMany({ where: { projectId: existing.id, userId } }),
      prisma.project.deleteMany({ where: { id: existing.id, userId } }),
    ]);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
