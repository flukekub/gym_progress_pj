import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Exercise } from "@/models/Exercise";
import { WorkoutLog } from "@/models/WorkoutLog";

const setSchema = z.object({
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  durationSec: z.number().min(0).optional(),
  distanceM: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  completed: z.boolean().default(true),
});

const exerciseLogSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().min(0).default(0),
  sets: z.array(setSchema).min(1),
  note: z.string().max(500).optional(),
});

const workoutLogSchema = z.object({
  date: z.coerce.date(),
  title: z.string().max(120).optional(),
  exercises: z.array(exerciseLogSchema).min(1),
  durationMin: z.number().min(0).optional(),
});

/**
 * POST /api/workout-logs
 *
 * Logs a workout session for the authenticated user.
 * Calculates totalVolume = sum(set.reps * set.weight) across all sets.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const data = workoutLogSchema.parse(json);

    const totalVolume = data.exercises.reduce((acc, ex) => {
      const exVol = ex.sets.reduce((s, set) => {
        if (set.reps && set.weight) return s + set.reps * set.weight;
        return s;
      }, 0);
      return acc + exVol;
    }, 0);

    await dbConnect();

    // Snapshot exercise names so logs stay readable even if an exercise is
    // later deleted from the user's library.
    const exerciseIds = Array.from(
      new Set(data.exercises.map((e) => e.exerciseId)),
    );
    const exerciseDocs = await Exercise.find({
      _id: { $in: exerciseIds },
      userId: session.user.id,
    })
      .select("name")
      .lean();
    const nameById = new Map(exerciseDocs.map((d) => [String(d._id), d.name]));

    const log = await WorkoutLog.create({
      userId: session.user.id,
      date: data.date,
      title: data.title,
      exercises: data.exercises.map((ex) => ({
        ...ex,
        exerciseName: nameById.get(ex.exerciseId),
      })),
      durationMin: data.durationMin,
      totalVolume,
    });

    return NextResponse.json({ log }, { status: 201 });
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

/**
 * GET /api/workout-logs?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns logs for the authenticated user in an optional date range.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  await dbConnect();

  const filter: Record<string, unknown> = { userId: session.user.id };
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    filter.date = range;
  }

  const logs = await WorkoutLog.find(filter)
    .sort({ date: -1 })
    .populate("exercises.exerciseId", "name muscleGroup unit")
    .lean();

  return NextResponse.json({ logs });
}
