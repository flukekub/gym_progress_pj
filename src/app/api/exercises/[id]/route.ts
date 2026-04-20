import { NextResponse } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import {
  Exercise,
  MUSCLE_GROUPS,
  EQUIPMENT,
  UNITS,
} from "@/models/Exercise";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  equipment: z.enum(EQUIPMENT).optional(),
  unit: z.enum(UNITS).optional(),
  notes: z.string().max(500).optional(),
});

type RouteCtx = { params: { id: string } };

function assertValidId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  return null;
}

export async function PATCH(req: Request, { params }: RouteCtx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invalid = assertValidId(params.id);
  if (invalid) return invalid;

  try {
    const json = await req.json();
    const data = updateSchema.parse(json);

    await dbConnect();
    const updated = await Exercise.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      data,
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ exercise: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.errors },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteCtx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invalid = assertValidId(params.id);
  if (invalid) return invalid;

  await dbConnect();
  const deleted = await Exercise.findOneAndDelete({
    _id: params.id,
    userId: session.user.id,
  }).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
