import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getWarehouseDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const db = await getWarehouseDb();
    const equipment = await db.collection("equipment").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(equipment);
  } catch (err) {
    console.error("[v0] GET /api/equipment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.category || !body.quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getWarehouseDb();
    const equipmentCollection = db.collection("equipment");

    // Check if equipment exists
    const existing = await equipmentCollection.findOne({ name: body.name });

    if (existing) {
      await equipmentCollection.updateOne(
        { name: body.name },
        {
          $set: {
            ...body,
            quantity: Number(body.quantity),
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ success: true, message: "Equipment updated" });
    } else {
      const newEquipment = {
        name: body.name,
        serialNumber: body.serialNumber || "",
        category: body.category,
        quantity: Number(body.quantity),
        unit: body.unit || "pieces",
        condition: body.condition || "good",
        location: body.location || "unknown",
        createdAt: new Date(),
      };

      await equipmentCollection.insertOne(newEquipment);
      return NextResponse.json({ success: true, message: "Equipment added" }, { status: 201 });
    }
  } catch (err) {
    console.error("[v0] POST /api/equipment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
