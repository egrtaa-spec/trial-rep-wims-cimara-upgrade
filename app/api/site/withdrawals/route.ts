import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { requireEngineer } from '@/lib/session';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const engineer = requireEngineer();
    const db = await getDb((await engineer).site);
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const q: any = {};
    if (startDate && endDate) {
      q.withdrawalDate = { $gte: startDate, $lte: endDate };
    }

    const withdrawals = await db.collection('withdrawals').find(q).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(withdrawals);
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Error' }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const engineer = requireEngineer();
    const db = await getDb((await engineer).site);
    const body = await req.json();

    const { withdrawalDate, description, notes, items } = body;

    if (!withdrawalDate || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    for (const item of items) {
      const eq = await db.collection('equipment').findOne({ _id: new ObjectId(item.equipmentId) });
      if (!eq) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      if (Number(item.quantityWithdrawn) > Number(eq.quantity)) {
        return NextResponse.json({ error: `Insufficient stock for ${eq.name}` }, { status: 400 });
      }
    }

    for (const item of items) {
      await db.collection('equipment').updateOne(
        { _id: new ObjectId(item.equipmentId) },
        { $inc: { quantity: -Number(item.quantityWithdrawn) } }
      );
    }

    const result = await db.collection('withdrawals').insertOne({
      withdrawalDate,
      engineerName: (await engineer).name,
      description: description || '',
      notes: notes || '',
      items: items.map((i: any) => ({
        equipmentId: i.equipmentId,
        equipmentName: i.equipmentName,
        quantityWithdrawn: Number(i.quantityWithdrawn),
        unit: i.unit,
      })),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: String(result.insertedId) });
  } catch (e: any) {
    const status = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: e?.message || 'Error' }, { status });
  }
}
