import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  const adminEmail = "admin@demo.com";
  const userEmail = "user@demo.com";

  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminPassword,
        role: "ADMIN",
      },
    });
  }

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: userEmail,
        password: userPassword,
        role: "USER",
      },
    });
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

