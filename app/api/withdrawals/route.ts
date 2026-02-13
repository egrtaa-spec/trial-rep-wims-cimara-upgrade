import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getWarehouseDb, getSiteDb } from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const q: any = {};
    if (startDate && endDate) q.withdrawalDate = { $gte: startDate, $lte: endDate };

    const db = session.role === 'ADMIN' ? await getWarehouseDb() : await getSiteDb(session.site);
    const withdrawals = await db.collection('withdrawals').find(q).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(withdrawals);
  } catch (e: any) {
    console.error('[v0] Withdrawals GET error:', e);
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await req.json();
    const db = session.role === 'ADMIN' ? await getWarehouseDb() : await getSiteDb(session.site);
    
    const result = await db.collection('withdrawals').insertOne({
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (e: any) {
    console.error('[v0] Withdrawals POST error:', e);
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
