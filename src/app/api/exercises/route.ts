import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import {
  Exercise,
  MUSCLE_GROUPS,
  EQUIPMENT,
  UNITS,
} from "@/models/Exercise";

const exerciseSchema = z.object({
  name: z.string().min(1).max(80),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT),
  unit: z.enum(UNITS),
  notes: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const muscleGroup = searchParams.get("muscleGroup");

  await dbConnect();

  const filter: Record<string, unknown> = { userId: session.user.id };
  if (q) filter.name = { $regex: q, $options: "i" };
  if (muscleGroup) filter.muscleGroup = muscleGroup;

  const exercises = await Exercise.find(filter)
    .sort({ muscleGroup: 1, name: 1 })
    .lean();

  return NextResponse.json({ exercises });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const data = exerciseSchema.parse(json);

    await dbConnect();

    const exercise = await Exercise.create({
      ...data,
      userId: session.user.id,
      isCustom: true,
    });

    return NextResponse.json({ exercise }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.errors },
        { status: 400 }
      );
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Exercise name already exists" },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
