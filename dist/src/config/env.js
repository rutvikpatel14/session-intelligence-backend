"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.string().default("4000"),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    JWT_ACCESS_SECRET: zod_1.z.string().optional(),
    JWT_REFRESH_SECRET: zod_1.z.string().optional(),
    ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default("15m"), // 15 minutes
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default("7d"), // 7 days
    FRONTEND_ORIGIN: zod_1.z.string().min(1, "FRONTEND_ORIGIN is required"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
const base = parsed.data;
function ensureSecret(current, name) {
    if (current && current.length >= 32) {
        return current;
    }
    const generated = crypto_1.default.randomBytes(48).toString("hex");
    // eslint-disable-next-line no-console
    console.warn(`⚠️ ${name} is not set or too short. Generated a temporary secret at runtime. Tokens will be invalidated on server restart.`);
    return generated;
}
exports.env = {
    ...base,
    JWT_ACCESS_SECRET: ensureSecret(base.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: ensureSecret(base.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
};
exports.isProduction = exports.env.NODE_ENV === "production";
