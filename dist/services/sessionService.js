"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = void 0;
const sessionRepository_1 = require("../repositories/sessionRepository");
const errors_1 = require("../utils/errors");
exports.sessionService = {
    getUserSessions(userId) {
        return sessionRepository_1.sessionRepository.findByUser(userId);
    },
    async deleteUserSession(userId, sessionId) {
        const sessions = await sessionRepository_1.sessionRepository.findByUser(userId);
        const target = sessions.find((s) => s.id === sessionId);
        if (!target) {
            throw new errors_1.AppError("Session not found", 404, "SESSION_NOT_FOUND");
        }
        await sessionRepository_1.sessionRepository.deleteById(sessionId);
    },
    async deleteAllUserSessions(userId) {
        await sessionRepository_1.sessionRepository.deleteAllForUser(userId);
    },
    getAllSessions() {
        return sessionRepository_1.sessionRepository.getAllSessions();
    },
    async adminDeleteSession(sessionId) {
        await sessionRepository_1.sessionRepository.deleteById(sessionId);
    },
};
