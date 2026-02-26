"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userRepository_1 = require("../repositories/userRepository");
const sessionRepository_1 = require("../repositories/sessionRepository");
const crypto_1 = require("../utils/crypto");
const token_1 = require("../utils/token");
const network_1 = require("../utils/network");
const errors_1 = require("../utils/errors");
const MAX_SESSIONS_PER_USER = 3;
exports.authService = {
    async register({ email, password }) {
        const existing = await userRepository_1.userRepository.findByEmail(email);
        if (existing) {
            throw new errors_1.AppError("Email already in use", 400, "EMAIL_TAKEN");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await userRepository_1.userRepository.create({
            email,
            password: hashedPassword,
            role: "USER",
        });
        return {
            id: user.id,
            email: user.email,
            role: "user",
        };
    },
    async login(context) {
        const user = await userRepository_1.userRepository.findByEmail(context.email);
        if (!user) {
            throw new errors_1.AuthError("Invalid credentials", "INVALID_CREDENTIALS");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(context.password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.AuthError("Invalid credentials", "INVALID_CREDENTIALS");
        }
        const country = (0, network_1.getCountryFromIp)(context.ipAddress);
        const ipRange = (0, network_1.getIpRange)(context.ipAddress);
        const { countries, ipRanges } = await sessionRepository_1.sessionRepository.getUserSessionCountriesAndIpRanges(user.id);
        const isNewCountry = countries.size > 0 && !countries.has(country);
        const isNewIpRange = ipRanges.size > 0 && !ipRanges.has(ipRange);
        const isSuspicious = isNewCountry || isNewIpRange;
        const refreshToken = (0, token_1.signRefreshToken)({ sub: user.id });
        const refreshTokenHash = (0, crypto_1.hashToken)(refreshToken);
        const session = await sessionRepository_1.sessionRepository.create({
            userId: user.id,
            refreshTokenHash,
            deviceName: context.deviceName,
            ipAddress: context.ipAddress,
            country,
            userAgent: context.userAgent,
            isSuspicious,
        });
        await sessionRepository_1.sessionRepository.enforceMaxSessions(user.id, MAX_SESSIONS_PER_USER);
        const accessToken = (0, token_1.signAccessToken)({
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
    async refresh(refreshToken, ipAddress, userAgent) {
        let payload;
        try {
            payload = (0, token_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            throw new errors_1.AuthError("Invalid or expired refresh token", "REFRESH_INVALID");
        }
        const refreshTokenHash = (0, crypto_1.hashToken)(refreshToken);
        const existingSession = await sessionRepository_1.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
        if (!existingSession) {
            // Token is valid but does not match any active session -> possible reuse
            await sessionRepository_1.sessionRepository.deleteAllForUser(payload.sub);
            throw new errors_1.AppError("Suspicious activity detected. All sessions terminated.", 403, "REFRESH_TOKEN_REUSE_DETECTED");
        }
        if (existingSession.isSuspicious) {
            throw new errors_1.AppError("Session requires verification before continuing.", 403, "SESSION_VERIFICATION_REQUIRED");
        }
        const user = await userRepository_1.userRepository.findById(existingSession.userId);
        if (!user) {
            await sessionRepository_1.sessionRepository.deleteById(existingSession.id);
            throw new errors_1.AuthError("User not found for session", "USER_NOT_FOUND");
        }
        const newRefreshToken = (0, token_1.signRefreshToken)({ sub: user.id });
        const newRefreshHash = (0, crypto_1.hashToken)(newRefreshToken);
        await sessionRepository_1.sessionRepository.updateRefreshToken(existingSession.id, newRefreshHash, new Date());
        const accessToken = (0, token_1.signAccessToken)({
            sub: user.id,
            role: user.role === "ADMIN" ? "admin" : "user",
        });
        const country = (0, network_1.getCountryFromIp)(ipAddress);
        // Best-effort update of device / ip metadata
        await sessionRepository_1.sessionRepository.updateRefreshToken(existingSession.id, newRefreshHash, new Date());
        await sessionRepository_1.sessionRepository.enforceMaxSessions(user.id, MAX_SESSIONS_PER_USER);
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
    async logout(refreshToken, userId) {
        if (refreshToken) {
            const hash = (0, crypto_1.hashToken)(refreshToken);
            const session = await sessionRepository_1.sessionRepository.findByRefreshTokenHash(hash);
            if (session) {
                await sessionRepository_1.sessionRepository.deactivateById(session.id);
                return;
            }
        }
        if (userId) {
            await sessionRepository_1.sessionRepository.deleteAllForUser(userId);
        }
    },
    async verifySession(userId, sessionId) {
        const sessions = await sessionRepository_1.sessionRepository.findByUser(userId);
        const target = sessions.find((s) => s.id === sessionId);
        if (!target) {
            throw new errors_1.AppError("Session not found", 404, "SESSION_NOT_FOUND");
        }
        if (!target.isSuspicious) {
            return;
        }
        await sessionRepository_1.sessionRepository.markNotSuspicious(sessionId);
    },
};
