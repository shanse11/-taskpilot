import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthClaims {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

const developmentSecret = "taskpilot-local-development-secret-change-before-deploying";

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : developmentSecret);
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  return secret;
}

export function assertJwtConfiguration(): void {
  jwtSecret();
}

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, jwtSecret(), {
    algorithm: "HS256",
    subject: userId,
    expiresIn: "1h",
  });
}

function unauthorized(response: Response): void {
  response.status(401).json({ error: "unauthorized", message: "A valid Bearer token is required" });
}

export const requireAuth: RequestHandler = (request: Request, response: Response, next: NextFunction) => {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    unauthorized(response);
    return;
  }

  try {
    const decoded = jwt.verify(match[1]!, jwtSecret(), { algorithms: ["HS256"] }) as JwtPayload & Partial<AuthClaims>;
    if (typeof decoded.userId !== "string" || typeof decoded.email !== "string" || decoded.sub !== decoded.userId) {
      unauthorized(response);
      return;
    }
    request.auth = { userId: decoded.userId, email: decoded.email };
    next();
  } catch {
    unauthorized(response);
  }
};
