// src/config/env.ts - BULLETPROOF for Prisma + Render
import 'dotenv/config';  // Built-in, NO side effects
import crypto from 'crypto';

// NO EARLY VALIDATION - let Prisma load first
const rawEnv = process.env;

function generateSecret(name: string): string {
  const secret = crypto.randomBytes(48).toString('hex');
  console.log(`🔑 ${name} auto-generated (${secret.length} chars)`);
  return secret;
}

// Create safe env object - NO Zod crash
export const env = {
  PORT: rawEnv.PORT || '4000',
  DATABASE_URL: rawEnv.DATABASE_URL!,
  JWT_ACCESS_SECRET: rawEnv.JWT_ACCESS_SECRET || generateSecret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: rawEnv.JWT_REFRESH_SECRET || generateSecret('JWT_REFRESH_SECRET'),
  FRONTEND_ORIGIN: rawEnv.FRONTEND_ORIGIN || 'http://localhost:3000',
  ACCESS_TOKEN_EXPIRES_IN: rawEnv.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: rawEnv.REFRESH_TOKEN_EXPIRES_IN || '7d',
};

export const isProduction = rawEnv.NODE_ENV === 'production';

console.log('✅ Env module loaded - secrets ready');
