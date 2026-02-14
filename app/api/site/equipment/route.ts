import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { getSiteDb } from '@/lib/mongodb'; 

// ✅ Named export for GET (to refresh the dashboard)
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    if (session.role !== 'ADMIN' && session.role !== 'ENGINEER') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const siteKey = session.site || 'ENAM';
    const db = await getSiteDb(siteKey);
    const equipment = await db.collection('equipment').find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(equipment || []);
  } catch (e: any) {
    console.error('Site equipment GET error:', e);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// ✅ Named export for POST (to add the equipment)
export async function POST(req: Request) {
  try {
    console.log('[v0] Equipment POST - Getting session...');
    const session = await getSession();
    
    console.log('[v0] Equipment POST - Session:', session ? `User ${session.username}` : 'null');
    
    if (!session) {
      console.log('[v0] Equipment POST - No session, returning 401');
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    if (session.role !== 'ADMIN' && session.role !== 'ENGINEER') {
      console.log('[v0] Equipment POST - Invalid role:', session.role);
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const siteKey = session.site || 'ENAM';
    console.log('[v0] Equipment POST - Getting DB for site:', siteKey);
    const db = await getSiteDb(siteKey);
    
    const body = await req.json();
    const { name, quantity } = body;

    const numQuantity = Number(quantity);
    if (!name || isNaN(numQuantity)) {
      return NextResponse.json({ error: 'Invalid name or quantity' }, { status: 400 });
    }

    const equipmentCollection = db.collection('equipment');
    const existing = await equipmentCollection.findOne({ name });
    
    if (existing) {
      await equipmentCollection.updateOne(
        { name },
        { 
          $set: { ...body, quantity: numQuantity, updatedAt: new Date() }
        }
      );
      return NextResponse.json({ success: true, updated: true });
    } else {
      await equipmentCollection.insertOne({
        ...body,
        quantity: numQuantity,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return NextResponse.json({ success: true, updated: false });
    }
  } catch (e: any) {
    console.error('Site equipment POST error:', e);
    return NextResponse.json({ error: 'Failed to register equipment' }, { status: 500 });
  }
}
