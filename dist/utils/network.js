"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
exports.getIpRange = getIpRange;
exports.getCountryFromIp = getCountryFromIp;
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();
    return forwarded || (req.ip || req.socket.remoteAddress || "0.0.0.0");
}
function getIpRange(ip) {
    const parts = ip.split(".");
    if (parts.length >= 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return ip;
}
// Mock country detection based on IP range
function getCountryFromIp(ip) {
    const range = getIpRange(ip);
    if (range.startsWith("10."))
        return "US";
    if (range.startsWith("172."))
        return "DE";
    if (range.startsWith("192.168."))
        return "IN";
    // Fallback mock
    return "US";
}
