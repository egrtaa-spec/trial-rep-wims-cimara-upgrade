import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { getSiteDb } from '@/lib/mongodb'; 

// ✅ Named export for GET (to refresh the dashboard)
export async function GET() {
  try {
    const session = await getSession();
    // Use UPPERCASE to match your session types
    if (!session || (session.role !== 'ADMIN' && session.role !== 'ENGINEER')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const siteKey = (session as any).site || 'ENAM';
    const db = await getSiteDb(siteKey);
    const equipment = await db.collection('equipment').find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(equipment);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ Named export for POST (to add the equipment)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    // 🔐 Role check
    if (!session || (session.role !== 'ADMIN' && session.role !== 'ENGINEER')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const siteKey = (session as any).site || 'ENAM';
    const db = await getSiteDb(siteKey); // ✅ Connect to specific site DB
    
    const body = await req.json();
    const { name, quantity } = body;

    // 🔢 Ensure quantity is a number to prevent MongoDB math errors
    const numQuantity = Number(quantity);
    if (!name || isNaN(numQuantity)) {
      return NextResponse.json({ error: 'Invalid name or quantity' }, { status: 400 });
    }

    const equipmentCollection = db.collection('equipment');

    // 🔄 Check if equipment exists
    const existing = await equipmentCollection.findOne({ name });
    
    if (existing) {
      // Update existing equipment
      await equipmentCollection.updateOne(
        { name },
        { 
          $set: { ...body, quantity: numQuantity, updatedAt: new Date() }
        }
      );
      return NextResponse.json({ success: true, updated: true });
    } else {
      // Insert new equipment
      await equipmentCollection.insertOne({
        ...body,
        quantity: numQuantity,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return NextResponse.json({ success: true, updated: false });
    }
  } catch (e: any) {
    console.error("POST Equipment Error:", e.message);
    return NextResponse.json({ error: `Failed to register equipment: ${e.message}` }, { status: 500 });
  }
}
