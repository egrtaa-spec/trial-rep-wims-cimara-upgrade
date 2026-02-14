import { NextResponse } from "next/server";
import { getSiteDb } from "@/lib/mongodb";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { site, username, password } = await req.json();
    
    console.log('[v0] Login attempt - site:', site, 'username:', username);
    
    if (!site || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getSiteDb(site);
    const users = db.collection("users");

    // Find user by username
    const user = await users.findOne({ username });
    
    if (!user) {
      console.log('[v0] User not found:', username);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('[v0] Invalid password for user:', username);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Set the session cookie with user data
    const sessionData = JSON.stringify({
      role: user.role || "ENGINEER",
      name: user.name || user.username,
      username: user.username,
      site: site,
    });

    console.log('[v0] Setting session cookie for user:', username, 'with data:', sessionData);

    const response = NextResponse.json({ success: true, message: "Login successful" });
    
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionData,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    console.log('[v0] Login successful for user:', username);
    return response;
  } catch (error) {
    console.error("[v0] Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
