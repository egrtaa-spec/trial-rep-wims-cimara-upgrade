import { cookies } from "next/headers";

// ✅ Define the type here to fix the missing module error
export type SiteKey = "ENAM" | "MINFOPRA" | "SUPPTIC" | "ISMP";

export type Session = {
  role: "ENGINEER" | "ADMIN"; // ✅ Match the uppercase roles
  name: string;
  username: string;
  site: SiteKey;
};

export const SESSION_COOKIE_NAME = "cimara_session";

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch (err) {
    return null;
  }
}

export async function requireEngineer(): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== "ENGINEER") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}