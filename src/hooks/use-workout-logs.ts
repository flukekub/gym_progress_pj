"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type WorkoutSet = {
  reps?: number;
  weight?: number;
  durationSec?: number;
  distanceM?: number;
  rpe?: number;
  completed: boolean;
};

export type WorkoutExerciseLog = {
  exerciseId:
    | string
    | { _id: string; name: string; muscleGroup?: string; unit?: string }
    | null;
  exerciseName?: string;
  order: number;
  sets: WorkoutSet[];
  note?: string;
};

export type WorkoutLog = {
  _id: string;
  userId: string;
  date: string;
  title?: string;
  exercises: WorkoutExerciseLog[];
  totalVolume: number;
  durationMin?: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutLogInput = {
  date: string;
  title?: string;
  durationMin?: number;
  exercises: Array<{
    exerciseId: string;
    order: number;
    sets: WorkoutSet[];
    note?: string;
  }>;
};

const KEY = ["workout-logs"] as const;

export function useWorkoutLogs(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [...KEY, params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get<{ logs: WorkoutLog[] }>(
        "/workout-logs",
        { params },
      );
      return data.logs;
    },
  });
}

export function useCreateWorkoutLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WorkoutLogInput) => {
      const { data } = await apiClient.post<{ log: WorkoutLog }>(
        "/workout-logs",
        input,
      );
      return data.log;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
