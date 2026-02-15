import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// ✅ FIX: Define this here to stop the import error
export type SiteKey = "ENAM" | "MINFOPRA" | "SUPPTIC" | "ISMP";

export type Session = {
  role: "ENGINEER" | "ADMIN";
  name: string;
  username: string;
  site: SiteKey;
};

export const SESSION_COOKIE_NAME = "cimara_session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!raw) return NextResponse.json({ user: null }, { status: 200 });

    const user = JSON.parse(raw);
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}