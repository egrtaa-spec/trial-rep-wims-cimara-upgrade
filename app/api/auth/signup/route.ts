import { NextResponse } from "next/server";
import { getSiteDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE_NAME, Session } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { site, username, password, name } = await req.json();

    if (!site || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getSiteDb(site);
    const users = db.collection("users");

    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.insertOne({
      site,
      username,
      password: hashedPassword,
      name: name || username,  // ✅ Add name field
      role: "ENGINEER",  // ✅ FIXED: Use correct role
      createdAt: new Date(),
    });

    // ✅ OPTIONAL: Auto-login after signup
    const sessionData: Session = {
      role: "ENGINEER",
      name: name || username,
      username: username,
      site: site,
    };

    const response = NextResponse.json({ 
      success: true,
      message: "Signup successful" 
    });

    response.cookies.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}