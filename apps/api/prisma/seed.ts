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
  const user = await prisma.user.upsert({
    where: { email: "demo@taskpilot.local" },
    update: { name: "Demo User", passwordHash },
    create: {
      email: "demo@taskpilot.local",
      passwordHash,
      name: "Demo User",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "taskpilot-demo-project" },
    update: { name: "Product launch", description: "A small sample project", userId: user.id },
    create: {
      id: "taskpilot-demo-project",
      userId: user.id,
      name: "Product launch",
      description: "A small sample project",
    },
  });

  await prisma.task.upsert({
    where: { id: "taskpilot-demo-task" },
    update: {
      projectId: project.id,
      userId: user.id,
      title: "Draft the launch checklist",
      description: "Demo task; replace it with your own workflow.",
      priority: "high",
      status: "todo",
      position: 0,
    },
    create: {
      id: "taskpilot-demo-task",
      projectId: project.id,
      userId: user.id,
      title: "Draft the launch checklist",
      description: "Demo task; replace it with your own workflow.",
      priority: "high",
      status: "todo",
      position: 0,
    },
  });

  console.info("Seeded demo user, project, and task.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
