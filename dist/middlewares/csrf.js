"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.setCsrfCookie = setCsrfCookie;
exports.csrfProtection = csrfProtection;
const crypto_1 = __importDefault(require("crypto"));
const errors_1 = require("../utils/errors");
const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
function generateCsrfToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
function setCsrfCookie(res, token) {
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // must be readable by browser JavaScript to send header
        sameSite: "strict",
        secure: true,
        path: "/",
    });
}
function csrfProtection(req, _res, next) {
    // Only protect state-changing endpoints that rely on cookies (e.g. refresh, logout)
    const method = req.method.toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        return next();
    }
    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
    const csrfHeader = req.headers[CSRF_HEADER_NAME] ?? undefined;
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return next(new errors_1.AppError("Invalid CSRF token", 403, "CSRF_TOKEN_INVALID"));
    }
    return next();
}
