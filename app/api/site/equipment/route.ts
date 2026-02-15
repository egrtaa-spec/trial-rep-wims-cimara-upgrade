import { NextResponse } from "next/server";
import { getSiteDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    // 🔐 Role check: Match UPPERCASE roles
    if (!session || (session.role !== "ADMIN" && session.role !== "ENGINEER")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const db = await getSiteDb(session.site);
    const body = await req.json();
    
    // 🔢 Number safety to prevent DB errors
    const quantity = Number(body.quantity);

    await db.collection("equipment").insertOne({
      ...body,
      quantity,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}