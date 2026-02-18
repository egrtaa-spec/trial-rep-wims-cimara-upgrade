import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb, getWarehouseDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const db = await getDb(session.site);
    const equipment = await db.collection("equipment").find({}).toArray();
    return NextResponse.json(equipment);
  } catch (error) {
    console.error("GET /api/equipment error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
