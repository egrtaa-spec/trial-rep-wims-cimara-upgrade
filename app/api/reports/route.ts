import { NextResponse } from "next/server";
// @ts-expect-error: Ensure clientPromise is exported from the module
import { clientPromise } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type"); // daily | weekly
    const siteName = searchParams.get("siteName");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!type || !siteName || !startDate) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    end.setHours(23, 59, 59, 999);

    const withdrawals = await db.collection("withdrawals").find({
      siteName,
      createdAt: { $gte: start, $lte: end }
    }).toArray();

    if (type === "daily") {
      const totalWithdrawals = withdrawals.reduce(
        (sum: any, w: any) => sum + w.quantity,
        0
      );

      const equipmentMap: any = {};

      withdrawals.forEach((w: any) => {
        if (!equipmentMap[w.equipmentName]) {
          equipmentMap[w.equipmentName] = {
            equipmentName: w.equipmentName,
            quantityWithdrawn: 0,
            unit: w.unit || "",
            engineers: []
          };
        }

        equipmentMap[w.equipmentName].quantityWithdrawn += w.quantity;

        if (!equipmentMap[w.equipmentName].engineers.includes(w.engineer)) {
          equipmentMap[w.equipmentName].engineers.push(w.engineer);
        }
      });

      return NextResponse.json([
        {
          reportDate: start,
          siteName,
          totalWithdrawals,
          equipmentUsed: Object.values(equipmentMap)
        }
      ]);
    }

    if (type === "weekly") {
      const totalWithdrawals = withdrawals.reduce(
        (sum: any, w: any) => sum + w.quantity,
        0
      );

      return NextResponse.json([
        {
          weekStartDate: start,
          weekEndDate: end,
          siteName,
          totalWithdrawals
        }
      ]);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}