import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const tasksRouter = Router();
export const projectTasksRouter = Router({ mergeParams: true });

tasksRouter.use(requireAuth);
projectTasksRouter.use(requireAuth);

const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const prioritySchema = z.enum(["low", "medium", "high"]);
const dueDateSchema = z.string().trim().refine((value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  return /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}, "Use a valid ISO date or datetime").transform((value) => new Date(value));

const taskFields = {
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(10000).nullable(),
  priority: prioritySchema,
  status: taskStatusSchema,
  dueDate: dueDateSchema.nullable(),
  position: z.number().int().min(0).max(100000),
};
const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional(),
  priority: taskFields.priority.optional(),
  status: taskFields.status.optional(),
  dueDate: taskFields.dueDate.optional(),
}).strict();
const updateTaskSchema = z.object(taskFields).partial().strict().refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one task field to update",
});
const updateStatusSchema = z.object({
  status: taskStatusSchema,
  position: taskFields.position.optional(),
}).strict();
const sortSchema = z.enum(["position", "dueDate", "-dueDate", "priority", "-priority", "title", "-title", "createdAt", "-createdAt"]);

function validationError(response: Response, issues: { message: string; path: PropertyKey[] }[]): void {
  response.status(400).json({
    error: "validation_error",
    message: issues[0]?.message ?? "Request is invalid",
    issues: issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

function taskNotFound(response: Response): void {
  response.status(404).json({ error: "not_found", message: "Task not found" });
}

function projectNotFound(response: Response): void {
  response.status(404).json({ error: "not_found", message: "Project not found" });
}

function routeParam(request: Request, key: string): string {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function orderByFor(sort: z.infer<typeof sortSchema>) {
  if (sort === "position") return [{ position: "asc" as const }, { createdAt: "asc" as const }];
  const descending = sort.startsWith("-");
  const field = (descending ? sort.slice(1) : sort) as "dueDate" | "priority" | "title" | "createdAt";
  return [{ [field]: descending ? "desc" as const : "asc" as const }, { position: "asc" as const }];
}

async function updateTask(userId: string, taskId: string, update: z.infer<typeof updateTaskSchema>) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.task.findFirst({ where: { id: taskId, userId } });
    if (!existing) return null;

    const { status: requestedStatus, position: requestedPosition, ...fields } = update;
    const nextStatus = requestedStatus ?? existing.status;
    const shouldReorder = requestedStatus !== undefined || requestedPosition !== undefined;

    if (Object.keys(fields).length > 0) {
      await tx.task.update({ where: { id: existing.id }, data: fields });
    }

    if (shouldReorder) {
      const statuses = [...new Set([existing.status, nextStatus])];
      const affected = await tx.task.findMany({
        where: { projectId: existing.projectId, userId, status: { in: statuses } },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      });
      const sourceTasks = affected.filter((task) => task.status === existing.status && task.id !== existing.id);
      const destinationTasks = nextStatus === existing.status
        ? sourceTasks
        : affected.filter((task) => task.status === nextStatus && task.id !== existing.id);
      const defaultPosition = nextStatus === existing.status ? existing.position : destinationTasks.length;
      const insertionIndex = Math.min(requestedPosition ?? defaultPosition, destinationTasks.length);
      destinationTasks.splice(insertionIndex, 0, { ...existing, status: nextStatus });

      if (nextStatus !== existing.status) {
        for (let index = 0; index < sourceTasks.length; index += 1) {
          await tx.task.update({ where: { id: sourceTasks[index]!.id }, data: { position: index } });
        }
      }
      for (let index = 0; index < destinationTasks.length; index += 1) {
        const task = destinationTasks[index]!;
        await tx.task.update({ where: { id: task.id }, data: { status: nextStatus, position: index } });
      }
    }

    return tx.task.findFirst({
      where: { id: existing.id, userId },
      include: { project: { select: { id: true, name: true, status: true } } },
    });
  });
}

projectTasksRouter.get("/", async (request: Request, response: Response) => {
  const userId = request.auth!.userId;
  const project = await prisma.project.findFirst({ where: { id: routeParam(request, "projectId"), userId }, select: { id: true } });
  if (!project) {
    projectNotFound(response);
    return;
  }

  const querySchema = z.object({
    status: taskStatusSchema.optional(),
    priority: prioritySchema.optional(),
    q: z.string().trim().max(200).optional(),
    sort: sortSchema.optional(),
  });
  const parsed = querySchema.safeParse({
    status: request.query.status,
    priority: request.query.priority,
    q: request.query.q,
    sort: request.query.sort,
  });
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const { status, priority, q, sort } = parsed.data;
  const tasks = await prisma.task.findMany({
    where: {
      projectId: project.id,
      userId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
    },
    orderBy: sort === "priority" || sort === "-priority" ? [{ position: "asc" }, { createdAt: "asc" }] : orderByFor(sort ?? "position"),
    include: { project: { select: { id: true, name: true, status: true } } },
  });
  if (sort === "priority" || sort === "-priority") {
    const priorityOrder = { low: 0, medium: 1, high: 2 };
    tasks.sort((left, right) => {
      const direction = sort === "priority" ? 1 : -1;
      return direction * (priorityOrder[left.priority as keyof typeof priorityOrder] - priorityOrder[right.priority as keyof typeof priorityOrder]) || left.position - right.position;
    });
  }
  response.json({ tasks });
});

projectTasksRouter.post("/", async (request: Request, response: Response) => {
  const parsed = createTaskSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const userId = request.auth!.userId;
  const project = await prisma.project.findFirst({ where: { id: routeParam(request, "projectId"), userId }, select: { id: true } });
  if (!project) {
    projectNotFound(response);
    return;
  }

  const status = parsed.data.status ?? "todo";
  const lastTask = await prisma.task.findFirst({
    where: { projectId: project.id, userId, status },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      projectId: project.id,
      userId,
      status,
      priority: parsed.data.priority ?? "medium",
      position: (lastTask?.position ?? -1) + 1,
      description: parsed.data.description ?? null,
      dueDate: parsed.data.dueDate ?? null,
    },
    include: { project: { select: { id: true, name: true, status: true } } },
  });
  response.status(201).json({ task });
});

tasksRouter.get("/:id", async (request: Request, response: Response) => {
  const id = routeParam(request, "id");
  const task = await prisma.task.findFirst({
    where: { id, userId: request.auth!.userId },
    include: { project: { select: { id: true, name: true, status: true } } },
  });
  if (!task) {
    taskNotFound(response);
    return;
  }
  response.json({ task });
});

tasksRouter.patch("/:id/status", async (request: Request, response: Response) => {
  const parsed = updateStatusSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const task = await updateTask(request.auth!.userId, routeParam(request, "id"), parsed.data);
  if (!task) {
    taskNotFound(response);
    return;
  }
  response.json({ task });
});

tasksRouter.patch("/:id", async (request: Request, response: Response) => {
  const parsed = updateTaskSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const task = await updateTask(request.auth!.userId, routeParam(request, "id"), parsed.data);
  if (!task) {
    taskNotFound(response);
    return;
  }
  response.json({ task });
});

tasksRouter.delete("/:id", async (request: Request, response: Response) => {
  const result = await prisma.task.deleteMany({ where: { id: routeParam(request, "id"), userId: request.auth!.userId } });
  if (result.count === 0) {
    taskNotFound(response);
    return;
  }
  response.status(204).end();
});
