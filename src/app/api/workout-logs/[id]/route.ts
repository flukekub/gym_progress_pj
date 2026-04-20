import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { WorkoutLog } from "@/models/WorkoutLog";

export const runtime = "nodejs";

/**
 * GET /api/workout-logs/[id]
 * Returns a single workout log (with populated exercise names).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();
  const log = await WorkoutLog.findOne({
    _id: params.id,
    userId: session.user.id,
  })
    .populate("exercises.exerciseId", "name muscleGroup unit equipment")
    .lean();

  if (!log) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ log });
}

/**
 * DELETE /api/workout-logs/[id]
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();
  const result = await WorkoutLog.findOneAndDelete({
    _id: params.id,
    userId: session.user.id,
  });
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
