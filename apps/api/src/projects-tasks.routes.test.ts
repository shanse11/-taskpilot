import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { signAccessToken } from "./middleware/auth.js";

process.env.JWT_SECRET ??= "vitest-projects-tasks-secret-that-is-long-enough";

const suffix = crypto.randomUUID();
let userAId = "";
let userBId = "";
let tokenA = "";
let tokenB = "";
let projectAId = "";
let projectBId = "";

const authA = () => ({ Authorization: `Bearer ${tokenA}` });
const authB = () => ({ Authorization: `Bearer ${tokenB}` });

beforeAll(async () => {
  const passwordHash = await bcrypt.hash("test-password", 4);
  const [userA, userB] = await Promise.all([
    prisma.user.create({ data: { email: `projects-a-${suffix}@taskpilot.test`, name: "Project Owner A", passwordHash } }),
    prisma.user.create({ data: { email: `projects-b-${suffix}@taskpilot.test`, name: "Project Owner B", passwordHash } }),
  ]);
  userAId = userA.id;
  userBId = userB.id;
  tokenA = signAccessToken(userA.id, userA.email);
  tokenB = signAccessToken(userB.id, userB.email);
});

beforeEach(async () => {
  await prisma.task.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  await prisma.project.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
  const [projectA, projectB] = await Promise.all([
    prisma.project.create({ data: { userId: userAId, name: "Owner A project" } }),
    prisma.project.create({ data: { userId: userBId, name: "Owner B project" } }),
  ]);
  projectAId = projectA.id;
  projectBId = projectB.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
  await prisma.$disconnect();
});

describe("project and task API", () => {
  it("requires JWT, isolates project CRUD, and deletes project tasks", async () => {
    expect((await request(app).get("/api/projects")).status).toBe(401);

    const ownList = await request(app).get("/api/projects").set(authA());
    expect(ownList.status).toBe(200);
    expect(ownList.body.projects.map((project: { id: string }) => project.id)).toEqual([projectAId]);

    const created = await request(app).post("/api/projects").set(authA()).send({ name: "  Release plan  ", description: "Ship the new version" });
    expect(created.status).toBe(201);
    expect(created.body.project).toMatchObject({ name: "Release plan", description: "Ship the new version", status: "active", _count: { tasks: 0 } });

    const updated = await request(app).patch(`/api/projects/${created.body.project.id}`).set(authA()).send({ name: "Release plan 2", status: "archived" });
    expect(updated.status).toBe(200);
    expect(updated.body.project).toMatchObject({ name: "Release plan 2", status: "archived" });
    expect((await request(app).patch(`/api/projects/${created.body.project.id}`).set(authA()).send({ userId: userBId })).status).toBe(400);

    const child = await request(app).post(`/api/projects/${created.body.project.id}/tasks`).set(authA()).send({ title: "Remove with project" });
    expect(child.status).toBe(201);
    const details = await request(app).get(`/api/projects/${created.body.project.id}`).set(authA());
    expect(details.body.taskSummary).toEqual({ total: 1, todo: 1, in_progress: 0, done: 0 });

    for (const response of [
      await request(app).get(`/api/projects/${projectBId}`).set(authA()),
      await request(app).patch(`/api/projects/${projectBId}`).set(authA()).send({ name: "Intrusion" }),
      await request(app).delete(`/api/projects/${projectBId}`).set(authA()),
    ]) {
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("not_found");
    }

    expect((await request(app).delete(`/api/projects/${created.body.project.id}`).set(authA())).status).toBe(204);
    expect(await prisma.task.findUnique({ where: { id: child.body.task.id } })).toBeNull();
    expect((await request(app).get("/api/projects").set(authB())).body.projects.map((project: { id: string }) => project.id)).toEqual([projectBId]);
  });

  it("supports task CRUD, filters, sorting, board moves, and cross-user 404s", async () => {
    const first = await request(app).post(`/api/projects/${projectAId}/tasks`).set(authA()).send({
      title: "Launch release checklist",
      description: "Check launch readiness",
      priority: "high",
      dueDate: "2026-01-15",
    });
    const second = await request(app).post(`/api/projects/${projectAId}/tasks`).set(authA()).send({ title: "Write the specification", priority: "low" });
    const third = await request(app).post(`/api/projects/${projectAId}/tasks`).set(authA()).send({ title: "Launch customer note", status: "in_progress", priority: "high" });
    const foreign = await request(app).post(`/api/projects/${projectBId}/tasks`).set(authB()).send({ title: "Private task" });
    expect([first.status, second.status, third.status, foreign.status]).toEqual([201, 201, 201, 201]);
    expect(first.body.task.dueDate).toBe("2026-01-15T00:00:00.000Z");

    const ownTask = await request(app).get(`/api/tasks/${first.body.task.id}`).set(authA());
    expect(ownTask.status).toBe(200);
    expect(ownTask.body.task.project).toMatchObject({ id: projectAId, name: "Owner A project" });

    const filtered = await request(app).get(`/api/projects/${projectAId}/tasks?status=todo&priority=high&q=launch&sort=-title`).set(authA());
    expect(filtered.status).toBe(200);
    expect(filtered.body.tasks.map((task: { title: string }) => task.title)).toEqual(["Launch release checklist"]);
    const searched = await request(app).get(`/api/projects/${projectAId}/tasks?q=specification`).set(authA());
    expect(searched.body.tasks.map((task: { id: string }) => task.id)).toEqual([second.body.task.id]);
    const prioritySorted = await request(app).get(`/api/projects/${projectAId}/tasks?sort=priority`).set(authA());
    expect(prioritySorted.body.tasks.map((task: { id: string }) => task.id)).toEqual([second.body.task.id, first.body.task.id, third.body.task.id]);

    const patched = await request(app).patch(`/api/tasks/${first.body.task.id}`).set(authA()).send({
      title: "Updated release checklist",
      description: "New notes",
      priority: "medium",
      dueDate: null,
    });
    expect(patched.status).toBe(200);
    expect(patched.body.task).toMatchObject({ title: "Updated release checklist", description: "New notes", priority: "medium", dueDate: null });

    const moved = await request(app).patch(`/api/tasks/${first.body.task.id}/status`).set(authA()).send({ status: "done", position: 0 });
    expect(moved.status).toBe(200);
    expect(moved.body.task).toMatchObject({ status: "done", position: 0 });
    expect((await prisma.task.findUniqueOrThrow({ where: { id: second.body.task.id } })).position).toBe(0);
    const movedAgain = await request(app).patch(`/api/tasks/${first.body.task.id}`).set(authA()).send({ status: "in_progress", position: 0 });
    expect(movedAgain.body.task).toMatchObject({ status: "in_progress", position: 0 });

    for (const response of [
      await request(app).get(`/api/tasks/${first.body.task.id}`).set(authB()),
      await request(app).patch(`/api/tasks/${first.body.task.id}`).set(authB()).send({ title: "Intrusion" }),
      await request(app).delete(`/api/tasks/${first.body.task.id}`).set(authB()),
      await request(app).get(`/api/projects/${projectAId}/tasks`).set(authB()),
    ]) {
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("not_found");
    }

    expect((await request(app).get(`/api/projects/${projectBId}/tasks`).set(authA())).status).toBe(404);
    expect((await request(app).get(`/api/projects/${projectAId}/tasks?status=blocked`).set(authA())).status).toBe(400);
    expect((await request(app).post(`/api/projects/${projectAId}/tasks`).set(authA()).send({ title: "Invalid", userId: userBId })).status).toBe(400);
    expect((await request(app).delete(`/api/tasks/${first.body.task.id}`).set(authA())).status).toBe(204);
    expect(await prisma.task.findUnique({ where: { id: first.body.task.id } })).toBeNull();
  });
});
