import { prisma } from "../prisma/client";

export const sessionRepository = {
  create(data: {
    userId: string;
    refreshTokenHash: string;
    deviceName: string;
    ipAddress: string;
    country: string;
    userAgent: string;
    isSuspicious: boolean;
  }) {
    return prisma.session.create({ data });
  },

  updateRefreshToken(sessionId: string, refreshTokenHash: string, lastUsedAt: Date) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash,
        lastUsedAt,
      },
    });
  },

  markNotSuspicious(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { isSuspicious: false },
    });
  },

  deleteById(sessionId: string) {
    return prisma.session.delete({ where: { id: sessionId } });
  },

  async deactivateById(sessionId: string) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash: "" },
    });
  },

  deleteAllForUser(userId: string) {
    return prisma.session.deleteMany({ where: { userId } });
  },

  findByUser(userId: string) {
    return prisma.session.findMany({
      where: {
        userId,
        NOT: { refreshTokenHash: "" },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findByRefreshTokenHash(hash: string) {
    return prisma.session.findFirst({
      where: { refreshTokenHash: hash },
    });
  },

  async enforceMaxSessions(userId: string, maxSessions: number) {
    const sessions = await prisma.session.findMany({
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
    await prisma.session.deleteMany({
      where: {
        id: { in: toDelete.map((s) => s.id) },
      },
    });
  },

  async getUserSessionCountriesAndIpRanges(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        country: true,
        ipAddress: true,
      },
    });

    const countries = new Set<string>();
    const ipRanges = new Set<string>();

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
    return prisma.session.findMany({
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

