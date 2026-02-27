import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { AppError } from "../utils/errors";
import { isProduction } from "../config/env";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setCsrfCookie(res: Response, token: string) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: true, // must be readable by browser JavaScript to send header
    secure: true, // REQUIRED in production
    sameSite: "none",
    path: "/",
  });
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  // Only protect state-changing endpoints that rely on cookies (e.g. refresh, logout)
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = (req.headers[CSRF_HEADER_NAME] as string | undefined) ?? undefined;

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new AppError("Invalid CSRF token", 403, "CSRF_TOKEN_INVALID"));
  }

  return next();
}

