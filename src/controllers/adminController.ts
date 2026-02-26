import type { Request, Response, NextFunction } from "express";
import { sessionService } from "../services/sessionService";

export const adminController = {
  getAllSessions: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await sessionService.getAllSessions();
      const safeSessions = sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        ipAddress: s.ipAddress,
        country: s.country,
        userAgent: s.userAgent,
        isSuspicious: s.isSuspicious,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        user: {
          id: s.user.id,
          email: s.user.email,
          role: s.user.role === "ADMIN" ? "admin" : "user",
        },
      }));
      return res.status(200).json({ sessions: safeSessions });
    } catch (err) {
      return next(err);
    }
  },

  deleteSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = String(req.params.id);
      await sessionService.adminDeleteSession(sessionId);
      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },
};

