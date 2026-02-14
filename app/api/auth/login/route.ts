import { NextResponse } from "next/server";
import { getSiteDb } from "@/lib/mongodb";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { site, username, password } = await req.json();
    
    if (!site || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getSiteDb(site);
    const users = db.collection("users");

    // 1. Find user
    let user = await users.findOne({ username });
    
    // Development mode: create test user if doesn't exist
    if (!user && process.env.NODE_ENV !== 'production') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await users.insertOne({
        username,
        password: hashedPassword,
        role: "ENGINEER",
        name: username,
        site,
        createdAt: new Date(),
      });
      user = await users.findOne({ username });
    }
    
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Set the session cookie with user data
    const sessionData = JSON.stringify({
      role: user.role || "ENGINEER",
      name: user.name || user.username,
      username: user.username,
      site: site,
    });

    const response = NextResponse.json({ success: true, message: "Login successful" });
    
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionData,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("[v0] Login error:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
