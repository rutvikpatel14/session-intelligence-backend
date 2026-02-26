"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const token_1 = require("../utils/token");
const errors_1 = require("../utils/errors");
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return next(new errors_1.AuthError("Missing Authorization header", "AUTH_MISSING"));
    }
    const token = authHeader.slice("Bearer ".length);
    try {
        const payload = (0, token_1.verifyAccessToken)(token);
        const user = {
            id: payload.sub,
            role: payload.role,
        };
        req.user = user;
        return next();
    }
    catch {
        return next(new errors_1.AuthError("Invalid or expired access token", "AUTH_INVALID"));
    }
}
function requireRole(role) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.AuthError("Unauthenticated", "AUTH_MISSING"));
        }
        if (req.user.role !== role) {
            return next(new errors_1.ForbiddenError("Insufficient permissions", "ROLE_FORBIDDEN"));
        }
        return next();
    };
}
