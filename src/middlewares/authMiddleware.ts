import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token";
import type { AuthenticatedUser, UserRole } from "../types/auth";
import { AuthError, ForbiddenError } from "../utils/errors";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AuthError("Missing Authorization header", "AUTH_MISSING"));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    const user: AuthenticatedUser = {
      id: payload.sub,
      role: payload.role,
    };
    req.user = user;
    return next();
  } catch {
    return next(new AuthError("Invalid or expired access token", "AUTH_INVALID"));
  }
}

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthError("Unauthenticated", "AUTH_MISSING"));
    }
    if (req.user.role !== role) {
      return next(new ForbiddenError("Insufficient permissions", "ROLE_FORBIDDEN"));
    }
    return next();
  };
}

