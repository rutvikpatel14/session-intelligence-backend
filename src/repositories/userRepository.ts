import { prisma } from "../prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: { email: string; password: string; role: "ADMIN" | "USER" }) {
    return prisma.user.create({ data });
  },
};

