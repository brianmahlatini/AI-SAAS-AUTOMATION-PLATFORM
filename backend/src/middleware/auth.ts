import type { NextFunction, Request, Response } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "./error";
import { upsertUser, type UserRole } from "../modules/users/user.repository";

const clerkClient = config.auth.clerkSecretKey
  ? createClerkClient({
      secretKey: config.auth.clerkSecretKey
    })
  : undefined;

function parseBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }
  return header.slice("Bearer ".length).trim();
}

function normalizeRole(value: unknown): UserRole {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

export async function attachAuthContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = parseBearerToken(req);

    if (config.auth.clerkSecretKey && token) {
      const payload = await verifyToken(token, {
        secretKey: config.auth.clerkSecretKey
      });

      const claims = payload as Record<string, unknown>;
      const userId = String(claims.sub);
      const clerkUser = await clerkClient?.users.getUser(userId);
      const metadata = clerkUser?.publicMetadata ?? {};
      const role = normalizeRole(metadata.role);
      const email =
        clerkUser?.primaryEmailAddress?.emailAddress ??
        (typeof claims.email === "string" ? claims.email : undefined);
      const displayName =
        clerkUser?.fullName ??
        (typeof claims.name === "string"
          ? claims.name
          : typeof claims.full_name === "string"
            ? claims.full_name
            : undefined);

      const user = await upsertUser({ id: userId, email, displayName, role });
      req.auth = {
        userId: user.id,
        role: user.role,
        email: user.email,
        displayName: user.displayName
      };
      next();
      return;
    }

    if (config.env !== "production") {
      const userId = String(req.headers["x-user-id"] ?? "dev-user");
      const role = normalizeRole(String(req.headers["x-user-role"] ?? "USER"));
      const email = String(req.headers["x-user-email"] ?? "dev@example.com");
      const user = await upsertUser({ id: userId, email, displayName: "Development User", role });
      req.auth = {
        userId: user.id,
        role: user.role,
        email: user.email,
        displayName: user.displayName
      };
    }

    next();
  } catch (error) {
    logger.warn({ error }, "Authentication context failed");
    next();
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth?.userId) {
    next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
    return;
  }
  next();
}

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth?.userId) {
      next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
      return;
    }

    if (req.auth.role !== role) {
      next(new AppError(403, "You do not have permission to access this resource", "FORBIDDEN"));
      return;
    }

    next();
  };
}
