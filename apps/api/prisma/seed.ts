import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const demoPassword = process.env.SEED_USER_PASSWORD;
  if (!demoPassword) {
    throw new Error("Set SEED_USER_PASSWORD before running the demo seed.");
  }

  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const [avery, jordan] = await Promise.all([
    prisma.user.upsert({
      where: { email: "demo@taskpilot.local" },
      update: { name: "Avery Chen", passwordHash },
      create: { email: "demo@taskpilot.local", passwordHash, name: "Avery Chen" },
    }),
    prisma.user.upsert({
      where: { email: "jordan@taskpilot.local" },
      update: { name: "Jordan Lee", passwordHash },
      create: { email: "jordan@taskpilot.local", passwordHash, name: "Jordan Lee" },
    }),
  ]);

  const projects = [
    { id: "taskpilot-demo-project", userId: avery.id, name: "Product launch", description: "Prepare the next product release.", status: "active" },
    { id: "taskpilot-demo-research", userId: avery.id, name: "Customer research", description: "Collect feedback and turn it into product ideas.", status: "active" },
    { id: "taskpilot-jordan-website", userId: jordan.id, name: "Website refresh", description: "A second user's private project.", status: "active" },
  ];
  for (const project of projects) {
    await prisma.project.upsert({ where: { id: project.id }, update: project, create: project });
  }

  const tasks = [
    { id: "taskpilot-demo-task", projectId: "taskpilot-demo-project", userId: avery.id, title: "Draft the launch checklist", description: "List the steps required for a smooth release.", priority: "high", status: "todo", dueDate: new Date("2026-01-15T00:00:00.000Z"), position: 0 },
    { id: "taskpilot-demo-qa", projectId: "taskpilot-demo-project", userId: avery.id, title: "Run the release QA pass", description: "Verify the critical user journeys before launch.", priority: "high", status: "in_progress", dueDate: new Date("2026-12-01T00:00:00.000Z"), position: 0 },
    { id: "taskpilot-demo-announce", projectId: "taskpilot-demo-project", userId: avery.id, title: "Share the launch announcement", description: "The announcement draft is approved.", priority: "medium", status: "done", dueDate: null, position: 0 },
    { id: "taskpilot-research-interviews", projectId: "taskpilot-demo-research", userId: avery.id, title: "Schedule customer interviews", description: "Invite five customers for short interviews.", priority: "medium", status: "todo", dueDate: new Date("2026-11-10T00:00:00.000Z"), position: 0 },
    { id: "taskpilot-jordan-homepage", projectId: "taskpilot-jordan-website", userId: jordan.id, title: "Review homepage concepts", description: "Compare the first design directions.", priority: "low", status: "in_progress", dueDate: null, position: 0 },
  ];
  for (const task of tasks) {
    await prisma.task.upsert({ where: { id: task.id }, update: task, create: task });
  }

  console.info("Seeded 2 demo users, 3 projects, and 5 tasks.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
