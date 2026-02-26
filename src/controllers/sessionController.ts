import type { Request, Response, NextFunction } from "express";
import { sessionService } from "../services/sessionService";

export const sessionController = {
  getMySessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const sessions = await sessionService.getUserSessions(userId);
      const safeSessions = sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        ipAddress: s.ipAddress,
        country: s.country,
        userAgent: s.userAgent,
        isSuspicious: s.isSuspicious,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
      }));
      return res.status(200).json({ sessions: safeSessions });
    } catch (err) {
      return next(err);
    }
  },

  deleteMySession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const sessionId = String(req.params.id);
      await sessionService.deleteUserSession(userId, sessionId);
      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },

  deleteAllMySessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      await sessionService.deleteAllUserSessions(userId);
      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },
};

