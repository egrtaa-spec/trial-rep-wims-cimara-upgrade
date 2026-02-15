import { NextResponse } from "next/server";
import { getSiteDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE_NAME, Session } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { site, username, password } = await req.json();
    
    // Validate inputs
    if (!site || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getSiteDb(site);
    const users = db.collection("users");

    // 1. Find user in the site's database
    const user = await users.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. ✅ CREATE PROPER SESSION OBJECT
    const sessionData: Session = {
      role: user.role || "ENGINEER",  // Get from user document
      name: user.name || username,     // Get from user document
      username: username,
      site: site,  // The site they logged into
    };

    // 4. ✅ SET CORRECT COOKIE WITH CORRECT NAME
    const response = NextResponse.json({ 
      success: true, 
      message: "Login successful",
      user: {
        name: sessionData.name,
        role: sessionData.role,
        site: sessionData.site
      }
    });
    
    // ✅ THIS IS THE KEY FIX - Use SESSION_COOKIE_NAME and JSON.stringify
    response.cookies.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: "Server error",
      details: error.message 
    }, { status: 500 });
  }
}