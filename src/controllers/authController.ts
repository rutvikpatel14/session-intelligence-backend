import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";
import { getClientIp } from "../utils/network";
import { generateCsrfToken, setCsrfCookie } from "../middlewares/csrf";
import { env, isProduction } from "../config/env";

const REFRESH_COOKIE_NAME = "refreshToken";

function setAuthCookies(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);

  return csrfToken;
}

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const user = await authService.register({ email, password });
      return res.status(201).json({ user });
    } catch (err) {
      return next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, deviceName, ipAddress: ipFromClient } = req.body as {
        email: string;
        password: string;
        deviceName?: string;
        ipAddress?: string;
      };

      const ipAddress = ipFromClient || getClientIp(req);
      const userAgent = req.headers["user-agent"] || "unknown";

      const result = await authService.login({
        email,
        password,
        deviceName: deviceName || "Unknown device",
        ipAddress,
        userAgent: String(userAgent),
      });

      const csrfToken = setAuthCookies(res, result.tokens.refreshToken);

      return res.status(200).json({
        user: result.user,
        accessToken: result.tokens.accessToken,
        csrfToken,
        session: result.session,
        requiresVerification: result.requiresVerification,
      });
    } catch (err) {
      return next(err);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = (req.cookies?.refreshToken || null) as string | null;
      if (!refreshToken) {
        return res.status(401).json({
          error: { code: "REFRESH_MISSING", message: "Refresh token missing" },
        });
      }

      const ipAddress = getClientIp(req);
      const userAgent = String(req.headers["user-agent"] || "unknown");

      const result = await authService.refresh(refreshToken, ipAddress, userAgent);

      const csrfToken = setAuthCookies(res, result.tokens.refreshToken);

      return res.status(200).json({
        user: result.user,
        accessToken: result.tokens.accessToken,
        csrfToken,
        session: result.session,
      });
    } catch (err) {
      return next(err);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = (req.cookies?.refreshToken || null) as string | null;
      const userId = req.user?.id;

      await authService.logout(refreshToken, userId);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
      });
      res.clearCookie("csrfToken", {
        httpOnly: false,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },

  verifySession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body as { sessionId: string };
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: { code: "AUTH_MISSING", message: "Unauthenticated" },
        });
      }

      await authService.verifySession(userId, sessionId);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },
};

