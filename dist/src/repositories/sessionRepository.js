"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = void 0;
const client_1 = require("../prisma/client");
exports.sessionRepository = {
    create(data) {
        return client_1.prisma.session.create({ data });
    },
    updateRefreshToken(sessionId, refreshTokenHash, lastUsedAt) {
        return client_1.prisma.session.update({
            where: { id: sessionId },
            data: {
                refreshTokenHash,
                lastUsedAt,
            },
        });
    },
    markNotSuspicious(sessionId) {
        return client_1.prisma.session.update({
            where: { id: sessionId },
            data: { isSuspicious: false },
        });
    },
    deleteById(sessionId) {
        return client_1.prisma.session.delete({ where: { id: sessionId } });
    },
    async deactivateById(sessionId) {
        await client_1.prisma.session.update({
            where: { id: sessionId },
            data: { refreshTokenHash: "" },
        });
    },
    deleteAllForUser(userId) {
        return client_1.prisma.session.deleteMany({ where: { userId } });
    },
    findByUser(userId) {
        return client_1.prisma.session.findMany({
            where: {
                userId,
                NOT: { refreshTokenHash: "" },
            },
            orderBy: { createdAt: "desc" },
        });
    },
    findByRefreshTokenHash(hash) {
        return client_1.prisma.session.findFirst({
            where: { refreshTokenHash: hash },
        });
    },
    async enforceMaxSessions(userId, maxSessions) {
        const sessions = await client_1.prisma.session.findMany({
            where: {
                userId,
                NOT: { refreshTokenHash: "" },
            },
            orderBy: { createdAt: "asc" },
        });
        if (sessions.length <= maxSessions) {
            return;
        }
        const toDelete = sessions.slice(0, sessions.length - maxSessions);
        await client_1.prisma.session.deleteMany({
            where: {
                id: { in: toDelete.map((s) => s.id) },
            },
        });
    },
    async getUserSessionCountriesAndIpRanges(userId) {
        const sessions = await client_1.prisma.session.findMany({
            where: { userId },
            select: {
                country: true,
                ipAddress: true,
            },
        });
        const countries = new Set();
        const ipRanges = new Set();
        for (const s of sessions) {
            countries.add(s.country);
            const [a, b, c] = s.ipAddress.split(".");
            if (a && b && c) {
                ipRanges.add(`${a}.${b}.${c}`);
            }
        }
        return {
            countries,
            ipRanges,
        };
    },
    getAllSessions() {
        return client_1.prisma.session.findMany({
            where: {
                NOT: { refreshTokenHash: "" },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },
};
