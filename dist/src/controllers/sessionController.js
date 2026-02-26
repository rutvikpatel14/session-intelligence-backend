"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionController = void 0;
const sessionService_1 = require("../services/sessionService");
exports.sessionController = {
    getMySessions: async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const sessions = await sessionService_1.sessionService.getUserSessions(userId);
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
        }
        catch (err) {
            return next(err);
        }
    },
    deleteMySession: async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const sessionId = String(req.params.id);
            await sessionService_1.sessionService.deleteUserSession(userId, sessionId);
            return res.status(200).json({ success: true });
        }
        catch (err) {
            return next(err);
        }
    },
    deleteAllMySessions: async (req, res, next) => {
        try {
            const userId = req.user?.id;
            await sessionService_1.sessionService.deleteAllUserSessions(userId);
            return res.status(200).json({ success: true });
        }
        catch (err) {
            return next(err);
        }
    },
};
