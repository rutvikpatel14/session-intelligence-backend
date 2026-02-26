"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const sessionService_1 = require("../services/sessionService");
exports.adminController = {
    getAllSessions: async (_req, res, next) => {
        try {
            const sessions = await sessionService_1.sessionService.getAllSessions();
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
        }
        catch (err) {
            return next(err);
        }
    },
    deleteSession: async (req, res, next) => {
        try {
            const { id } = req.params;
            await sessionService_1.sessionService.adminDeleteSession(id);
            return res.status(200).json({ success: true });
        }
        catch (err) {
            return next(err);
        }
    },
};
