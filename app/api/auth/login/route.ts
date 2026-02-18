import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { site, username, password } = await req.json();

    if (!site || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Missing credentials" },
        { status: 400 }
      );
    }

    const db = await getDb(site);
    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const sessionData = {
      role: user.role || "ENGINEER",
      name: user.name || user.username,
      username: user.username,
      site,
    };

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: JSON.stringify(sessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server configuration error",
      },
      { status: 500 }
    );
  }
}