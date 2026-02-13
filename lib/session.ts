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
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    console.log("[v0] Session lookup - Cookie name:", SESSION_COOKIE_NAME);
    console.log("[v0] Session lookup - Raw value:", raw ? "present" : "missing");

    if (!raw) {
      console.log("[v0] No session cookie found");
      return null;
    }

    const parsed = JSON.parse(raw) as Session;

    // Basic validation check
    if (!parsed.role || !parsed.username || !parsed.site) {
      console.log("[v0] Session validation failed - missing fields");
      return null;
    }

    console.log("[v0] Session validated - User:", parsed.username, "Role:", parsed.role);
    return parsed;
  } catch (err) {
    console.error("[v0] Session error:", err);
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
