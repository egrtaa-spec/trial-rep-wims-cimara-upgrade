import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb(session.site);
  const equipment = await db.collection("equipment").find().toArray();

  return NextResponse.json(equipment);
}