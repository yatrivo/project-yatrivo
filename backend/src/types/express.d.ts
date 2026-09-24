export type UserRole = "super_admin" | "admin" | "user";
export type UserStatus = "invited" | "active" | "disabled" | "deleted";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  fullName: string | null;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};

