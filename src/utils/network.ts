import type { Request } from "express";
import geoip from "geoip-lite";

export function getClientIp(req: Request): string {
  const forwarded = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return forwarded || (req.ip || req.socket.remoteAddress || "0.0.0.0");
}

export function getIpRange(ip: string): string {
  const parts = ip.split(".");
  if (parts.length >= 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return ip;
}

// Country detection based on IP using geoip-lite with sensible fallbacks
export function getCountryFromIp(ip: string): string {
  const lookup = geoip.lookup(ip);
  if (lookup?.country) {
    return lookup.country;
  }

  const range = getIpRange(ip);

  if (range.startsWith("10.")) return "US";
  if (range.startsWith("172.")) return "DE";
  if (range.startsWith("192.168.")) return "IN";

  // Fallback when no mapping is available
  return "Unknown";
}

