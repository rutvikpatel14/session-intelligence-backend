import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import { hashToken } from "../utils/crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token";
import { getCountryFromIp, getIpRange } from "../utils/network";
import { AppError, AuthError } from "../utils/errors";
import { env } from "../config/env";

const MAX_SESSIONS_PER_USER = 3;

export interface LoginContext {
  email: string;
  password: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export const authService = {
  async register({ email, password }: RegisterInput) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Email already in use", 400, "EMAIL_TAKEN");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      email,
      password: hashedPassword,
      role: "USER",
    });

    return {
      id: user.id,
      email: user.email,
      role: "user" as const,
    };
  },

  async login(context: LoginContext) {
    const user = await userRepository.findByEmail(context.email);
    if (!user) {
      throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(context.password, user.password);
    if (!isPasswordValid) {
      throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const country = getCountryFromIp(context.ipAddress);
    const ipRange = getIpRange(context.ipAddress);

    const { countries, ipRanges } = await sessionRepository.getUserSessionCountriesAndIpRanges(user.id);

    const isNewCountry = countries.size > 0 && !countries.has(country);
    const isNewIpRange = ipRanges.size > 0 && !ipRanges.has(ipRange);
    const isSuspicious = isNewCountry || isNewIpRange;

    const refreshToken = signRefreshToken({ sub: user.id });
    const refreshTokenHash = hashToken(refreshToken);

    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash,
      deviceName: context.deviceName,
      ipAddress: context.ipAddress,
      country,
      userAgent: context.userAgent,
      isSuspicious,
    });

    await sessionRepository.enforceMaxSessions(user.id, MAX_SESSIONS_PER_USER);

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role === "ADMIN" ? "admin" : "user",
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role === "ADMIN" ? "admin" : "user",
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      session: {
        id: session.id,
        isSuspicious,
      },
      requiresVerification: isSuspicious,
    };
  },

  async refresh(refreshToken: string, ipAddress: string, userAgent: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthError("Invalid or expired refresh token", "REFRESH_INVALID");
    }

    const refreshTokenHash = hashToken(refreshToken);
    const existingSession = await sessionRepository.findByRefreshTokenHash(refreshTokenHash);

    if (!existingSession) {
      // Token is valid but does not match any active session -> possible reuse
      await sessionRepository.deleteAllForUser(payload.sub);
      throw new AppError(
        "Suspicious activity detected. All sessions terminated.",
        403,
        "REFRESH_TOKEN_REUSE_DETECTED"
      );
    }

    if (existingSession.isSuspicious) {
      throw new AppError(
        "Session requires verification before continuing.",
        403,
        "SESSION_VERIFICATION_REQUIRED"
      );
    }

    const user = await userRepository.findById(existingSession.userId);
    if (!user) {
      await sessionRepository.deleteById(existingSession.id);
      throw new AuthError("User not found for session", "USER_NOT_FOUND");
    }

    const newRefreshToken = signRefreshToken({ sub: user.id });
    const newRefreshHash = hashToken(newRefreshToken);

    await sessionRepository.updateRefreshToken(existingSession.id, newRefreshHash, new Date());

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role === "ADMIN" ? "admin" : "user",
    });

    const country = getCountryFromIp(ipAddress);

    // Best-effort update of device / ip metadata
    await sessionRepository.updateRefreshToken(existingSession.id, newRefreshHash, new Date());
    await sessionRepository.enforceMaxSessions(user.id, MAX_SESSIONS_PER_USER);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role === "ADMIN" ? "admin" : "user",
      },
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
      session: {
        id: existingSession.id,
        isSuspicious: existingSession.isSuspicious,
        country,
      },
    };
  },

  async logout(refreshToken: string | null, userId?: string) {
    if (refreshToken) {
      const hash = hashToken(refreshToken);
      const session = await sessionRepository.findByRefreshTokenHash(hash);
      if (session) {
        await sessionRepository.deactivateById(session.id);
        return;
      }
    }

    if (userId) {
      await sessionRepository.deleteAllForUser(userId);
    }
  },

  async verifySession(userId: string, sessionId: string) {
    const sessions = await sessionRepository.findByUser(userId);
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
    }
    if (!target.isSuspicious) {
      return;
    }

    await sessionRepository.markNotSuspicious(sessionId);
  },
};

