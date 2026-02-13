import { cookies } from "next/headers";
import { SiteKey } from "./sites";

/**
 * Session Structure
 * All users must belong to a site.
 */
export type Session = {
  role: "ENGINEER" | "ADMIN";
  name: string;
  username: string;
  site: SiteKey;
};

export const SESSION_COOKIE_NAME = "cimara_session"; // Must match across app

/**
 * Get session safely from cookie
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies();
    const raw = (await cookieStore).get(SESSION_COOKIE_NAME)?.value;

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;

    // Basic validation check
    if (!parsed.role || !parsed.username || !parsed.site) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Require any authenticated session
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Require ENGINEER role
 */
export async function requireEngineer(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "ENGINEER") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

/**
 * Require ADMIN role
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
