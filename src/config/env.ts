import dotenv from "dotenv";
import { z } from "zod";
import crypto from "crypto";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"), // 15 minutes
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"), // 7 days
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const base = parsed.data;

function ensureSecret(current: string | undefined, name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  if (current && current.length >= 32) {
    return current;
  }
  const generated = crypto.randomBytes(48).toString("hex");
  return generated;
}

export const env = {
  ...base,
  JWT_ACCESS_SECRET: ensureSecret(base.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: ensureSecret(base.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
};

export const isProduction = process.env.NODE_ENV === "production";

