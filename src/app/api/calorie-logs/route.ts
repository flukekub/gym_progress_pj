import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { CalorieLog } from "@/models/CalorieLog";

const calorieLogSchema = z.object({
  date: z.coerce.date(),
  caloriesBurned: z.number().min(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { date, caloriesBurned } = calorieLogSchema.parse(json);

    await dbConnect();

    // Create or update the calorie log for this user and date
    // ensure date is essentially the start of the day in UTC or local
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const log = await CalorieLog.findOneAndUpdate(
      { userId: session.user.id, date: startOfDay },
      { caloriesBurned },
      { new: true, upsert: true },
    );

    return NextResponse.json({ log }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.errors },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  let query: any = { userId: session.user.id };

  if (fromStr && toStr) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    to.setUTCHours(23, 59, 59, 999);
    query.date = { $gte: from, $lte: to };
  } else {
    // Only return recent if no dates provided
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    query.date = { $gte: oneMonthAgo };
  }

  try {
    await dbConnect();
    const logs = await CalorieLog.find(query).sort({ date: -1 }).lean();
    return NextResponse.json({ logs });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
