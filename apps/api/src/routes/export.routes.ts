import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const exportRouter = Router();

exportRouter.use(requireAuth);

function csvCell(value: string | null): string {
  return `"${(value ?? "").replaceAll('"', '""')}"`;
}

exportRouter.get("/tasks.csv", async (request: Request, response: Response) => {
  const tasks = await prisma.task.findMany({
    where: { userId: request.auth!.userId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: { project: { select: { name: true } } },
  });
  const rows = [
    ["id", "project", "title", "description", "status", "priority", "due_date", "created_at", "updated_at"],
    ...tasks.map((task) => [
      task.id,
      task.project.name,
      task.title,
      task.description ?? "",
      task.status,
      task.priority,
      task.dueDate?.toISOString() ?? "",
      task.createdAt.toISOString(),
      task.updatedAt.toISOString(),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;

  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", 'attachment; filename="taskpilot-tasks.csv"');
  response.setHeader("Cache-Control", "no-store");
  response.send(csv);
});
