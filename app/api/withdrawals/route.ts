import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getWarehouseDb, getDb } from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const q: any = {};
    if (startDate && endDate) q.withdrawalDate = { $gte: startDate, $lte: endDate };

    const db = session.role === 'ADMIN' ? await getWarehouseDb() : await getDb(session.site);
    const withdrawals = await db.collection('withdrawals').find(q).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(withdrawals);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
