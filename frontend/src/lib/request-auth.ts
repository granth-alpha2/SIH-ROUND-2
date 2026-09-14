import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME, verifyJWT, type UserRole, type UserSession } from "@/lib/auth";

export async function getRequestUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const headerStore = await headers();
    const authorization = headerStore.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      token = authorization.slice(7).trim();
    }
  }

  return token ? verifyJWT(token) : null;
}

export function isAdminRole(role: UserRole): boolean {
  return role === "fpo_admin" || role === "platform_admin";
}

export function canAccessOwner(user: UserSession, ownerId: string | null | undefined): boolean {
  return isAdminRole(user.role) || (!!ownerId && user.sub === ownerId);
}
