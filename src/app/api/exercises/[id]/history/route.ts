import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Exercise } from "@/models/Exercise";
import { WorkoutLog } from "@/models/WorkoutLog";

export const runtime = "nodejs";

/**
 * GET /api/exercises/[id]/history
 *
 * Returns every workout session that contains the given exercise, newest
 * first, along with rollup stats (best weight, best e1RM, total sessions,
 * total volume, total sets).
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

  const exercise = await Exercise.findOne({
    _id: params.id,
    userId: session.user.id,
  }).lean();
  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const logs = await WorkoutLog.find({
    userId: session.user.id,
    "exercises.exerciseId": params.id,
  })
    .sort({ date: -1 })
    .lean();

  type Set = {
    reps?: number;
    weight?: number;
    rpe?: number;
    completed?: boolean;
  };

  type Session = {
    logId: string;
    date: Date;
    title?: string;
    note?: string;
    sets: Set[];
    volume: number;
    bestWeight: number;
    bestE1RM: number;
  };

  const sessions: Session[] = [];
  let totalSets = 0;
  let totalVolume = 0;
  let bestWeight = 0;
  let bestE1RM = 0; // Epley formula: w * (1 + reps/30)

  for (const log of logs) {
    const match = log.exercises.find(
      (ex) => String(ex.exerciseId) === params.id,
    );
    if (!match) continue;

    let sessionVolume = 0;
    let sessionBestWeight = 0;
    let sessionBestE1RM = 0;

    for (const s of match.sets) {
      const reps = s.reps ?? 0;
      const weight = s.weight ?? 0;
      if (reps > 0 && weight > 0) {
        sessionVolume += reps * weight;
        if (weight > sessionBestWeight) sessionBestWeight = weight;
        const e1rm = weight * (1 + reps / 30);
        if (e1rm > sessionBestE1RM) sessionBestE1RM = e1rm;
      }
    }

    totalSets += match.sets.length;
    totalVolume += sessionVolume;
    if (sessionBestWeight > bestWeight) bestWeight = sessionBestWeight;
    if (sessionBestE1RM > bestE1RM) bestE1RM = sessionBestE1RM;

    sessions.push({
      logId: String(log._id),
      date: log.date,
      title: log.title,
      note: match.note,
      sets: match.sets,
      volume: sessionVolume,
      bestWeight: sessionBestWeight,
      bestE1RM: sessionBestE1RM,
    });
  }

  return NextResponse.json({
    exercise: {
      _id: String(exercise._id),
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      unit: exercise.unit,
      notes: exercise.notes,
    },
    sessions,
    stats: {
      totalSessions: sessions.length,
      totalSets,
      totalVolume,
      bestWeight,
      bestE1RM: Math.round(bestE1RM * 10) / 10,
    },
  });
}
