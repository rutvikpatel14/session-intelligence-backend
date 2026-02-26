export type UserRole = "admin" | "user";

export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
}

export interface JwtRefreshPayload {
  sub: string;
  // Additional claims can be added here if needed
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

