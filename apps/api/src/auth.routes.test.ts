import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

process.env.JWT_SECRET ??= "vitest-auth-secret-that-is-long-enough-for-hs256";

const email = `auth-${crypto.randomUUID()}@taskpilot.test`;
const password = "correct-horse-battery";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe("authentication API", () => {
  it("registers, signs in, reads and updates the current user's profile", async () => {
    const registration = await request(app).post("/api/auth/register").send({
      email: email.toUpperCase(),
      password,
      name: "  Avery Chen  ",
    });

    expect(registration.status).toBe(201);
    expect(registration.body.user).toMatchObject({ email, name: "Avery Chen" });
    expect(registration.body.user).not.toHaveProperty("passwordHash");

    const storedUser = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(storedUser.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, storedUser.passwordHash)).toBe(true);

    const duplicate = await request(app).post("/api/auth/register").send({ email, password, name: "Another name" });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toBe("email_already_registered");

    const invalidEmail = await request(app).post("/api/auth/register").send({ email: "not-an-email", password: "short", name: "" });
    expect(invalidEmail.status).toBe(400);

    const wrongPassword = await request(app).post("/api/auth/login").send({ email, password: "wrong-password" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error).toBe("invalid_credentials");

    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    expect(login.body.user).not.toHaveProperty("passwordHash");
    expect(jwt.decode(login.body.token)).toMatchObject({ userId: storedUser.id, email, sub: storedUser.id });

    const unauthorized = await request(app).get("/api/auth/me");
    expect(unauthorized.status).toBe(401);

    const profile = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.user).toMatchObject({ id: storedUser.id, email, name: "Avery Chen" });
    expect(profile.body.user).not.toHaveProperty("passwordHash");

    const updated = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ name: "  Avery Pilot  " });
    expect(updated.status).toBe(200);
    expect(updated.body.user.name).toBe("Avery Pilot");
    expect(updated.body.user).not.toHaveProperty("passwordHash");

    const current = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(current.body.user.name).toBe("Avery Pilot");
  });

  it("requires authentication on task and project routes and supports CORS preflight", async () => {
    expect((await request(app).get("/api/projects")).status).toBe(401);
    expect((await request(app).get("/api/tasks")).status).toBe(401);

    const preflight = await request(app)
      .options("/api/auth/me")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    expect(preflight.status).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(preflight.headers["access-control-allow-credentials"]).toBe("true");
  });
});
