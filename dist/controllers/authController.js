"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
const network_1 = require("../utils/network");
const csrf_1 = require("../middlewares/csrf");
const env_1 = require("../config/env");
const REFRESH_COOKIE_NAME = "refreshToken";
function setAuthCookies(res, refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: env_1.isProduction,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    const csrfToken = (0, csrf_1.generateCsrfToken)();
    (0, csrf_1.setCsrfCookie)(res, csrfToken);
    return csrfToken;
}
exports.authController = {
    register: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await authService_1.authService.register({ email, password });
            return res.status(201).json({ user });
        }
        catch (err) {
            return next(err);
        }
    },
    login: async (req, res, next) => {
        try {
            const { email, password, deviceName } = req.body;
            const ipAddress = (0, network_1.getClientIp)(req);
            const userAgent = req.headers["user-agent"] || "unknown";
            const result = await authService_1.authService.login({
                email,
                password,
                deviceName: deviceName || "Unknown device",
                ipAddress,
                userAgent: String(userAgent),
            });
            const csrfToken = setAuthCookies(res, result.tokens.refreshToken);
            return res.status(200).json({
                user: result.user,
                accessToken: result.tokens.accessToken,
                csrfToken,
                session: result.session,
                requiresVerification: result.requiresVerification,
            });
        }
        catch (err) {
            return next(err);
        }
    },
    refresh: async (req, res, next) => {
        try {
            const refreshToken = (req.cookies?.refreshToken || null);
            if (!refreshToken) {
                return res.status(401).json({
                    error: { code: "REFRESH_MISSING", message: "Refresh token missing" },
                });
            }
            const ipAddress = (0, network_1.getClientIp)(req);
            const userAgent = String(req.headers["user-agent"] || "unknown");
            const result = await authService_1.authService.refresh(refreshToken, ipAddress, userAgent);
            const csrfToken = setAuthCookies(res, result.tokens.refreshToken);
            return res.status(200).json({
                user: result.user,
                accessToken: result.tokens.accessToken,
                csrfToken,
                session: result.session,
            });
        }
        catch (err) {
            return next(err);
        }
    },
    logout: async (req, res, next) => {
        try {
            const refreshToken = (req.cookies?.refreshToken || null);
            const userId = req.user?.id;
            await authService_1.authService.logout(refreshToken, userId);
            res.clearCookie(REFRESH_COOKIE_NAME, {
                httpOnly: true,
                secure: env_1.isProduction,
                sameSite: "strict",
                path: "/",
            });
            res.clearCookie("csrfToken", {
                httpOnly: false,
                secure: env_1.isProduction,
                sameSite: "strict",
                path: "/",
            });
            return res.status(200).json({ success: true });
        }
        catch (err) {
            return next(err);
        }
    },
    verifySession: async (req, res, next) => {
        try {
            const { sessionId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    error: { code: "AUTH_MISSING", message: "Unauthenticated" },
                });
            }
            await authService_1.authService.verifySession(userId, sessionId);
            return res.status(200).json({ success: true });
        }
        catch (err) {
            return next(err);
        }
    },
};
