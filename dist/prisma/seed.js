"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg({
        connectionString: process.env.DATABASE_URL,
    }),
});
async function main() {
    const adminEmail = "admin@demo.com";
    const userEmail = "user@demo.com";
    const adminPassword = await bcryptjs_1.default.hash("admin123", 12);
    const userPassword = await bcryptjs_1.default.hash("user123", 12);
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
