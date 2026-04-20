import type { WorkoutSet } from "@/hooks/use-workout-logs";

export type DraftExercise = {
  key: string;
  exerciseId: string;
  sets: WorkoutSet[];
  note: string;
};

export const newSet = (): WorkoutSet => ({
  reps: undefined,
  weight: undefined,
  rpe: undefined,
  completed: true,
});

export const makeDraft = (exerciseId: string): DraftExercise => ({
  key: `${exerciseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  exerciseId,
  sets: [newSet(), newSet(), newSet()],
  note: "",
});
