import { sessionRepository } from "../repositories/sessionRepository";
import { AppError } from "../utils/errors";

export const sessionService = {
  getUserSessions(userId: string) {
    return sessionRepository.findByUser(userId);
  },

  async deleteUserSession(userId: string, sessionId: string) {
    const sessions = await sessionRepository.findByUser(userId);
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
    }
    await sessionRepository.deleteById(sessionId);
  },

  async deleteAllUserSessions(userId: string) {
    await sessionRepository.deleteAllForUser(userId);
  },

  getAllSessions() {
    return sessionRepository.getAllSessions();
  },

  async adminDeleteSession(sessionId: string) {
    await sessionRepository.deleteById(sessionId);
  },
};

