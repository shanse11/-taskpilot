import bcrypt from "bcryptjs";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, signAccessToken } from "../middleware/auth.js";

export const authRouter = Router();

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const emailSchema = z.string().trim().email().max(254, "Email must be at most 254 characters");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, "Password must be at most 72 bytes");

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().trim().min(1, "Name is required").max(80, "Name must be at most 80 characters"),
  })
  .strict();

const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(72, "Password must be at most 72 characters"),
  })
  .strict();

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80, "Name must be at most 80 characters"),
  })
  .strict();

function validationError(response: Response, issues: { message: string; path: PropertyKey[] }[]): void {
  response.status(400).json({
    error: "validation_error",
    message: issues[0]?.message ?? "Request body is invalid",
    issues: issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

authRouter.post("/register", async (request: Request, response: Response, next: NextFunction) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    response.status(409).json({ error: "email_already_registered", message: "An account with this email already exists" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: parsed.data.name },
      select: publicUserSelect,
    });
    response.status(201).json({ user });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      response.status(409).json({ error: "email_already_registered", message: "An account with this email already exists" });
      return;
    }
    next(error);
  }
});

authRouter.post("/login", async (request: Request, response: Response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    response.status(401).json({ error: "invalid_credentials", message: "Email or password is incorrect" });
    return;
  }

  const token = signAccessToken(user.id, user.email);
  const publicUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  response.status(200).json({ token, user: publicUser });
});

authRouter.post("/logout", requireAuth, (_request: Request, response: Response) => {
  // Bearer access tokens are stateless. The client removes its local token.
  response.status(204).end();
});

authRouter.get("/me", requireAuth, async (request: Request, response: Response) => {
  const userId = request.auth!.userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) {
    response.status(401).json({ error: "unauthorized", message: "The account for this token no longer exists" });
    return;
  }
  response.json({ user });
});

authRouter.patch("/me", requireAuth, async (request: Request, response: Response) => {
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(response, parsed.error.issues);
    return;
  }

  const user = await prisma.user.update({
    where: { id: request.auth!.userId },
    data: { name: parsed.data.name },
    select: publicUserSelect,
  });
  response.json({ user });
});
