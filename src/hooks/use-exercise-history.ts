"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type HistorySet = {
  reps?: number;
  weight?: number;
  rpe?: number;
  completed?: boolean;
};

export type HistorySession = {
  logId: string;
  date: string;
  title?: string;
  note?: string;
  sets: HistorySet[];
  volume: number;
  bestWeight: number;
  bestE1RM: number;
};

export type ExerciseHistory = {
  exercise: {
    _id: string;
    name: string;
    muscleGroup: string;
    equipment: string;
    unit: "kg" | "lb";
    notes?: string;
  };
  sessions: HistorySession[];
  stats: {
    totalSessions: number;
    totalSets: number;
    totalVolume: number;
    bestWeight: number;
    bestE1RM: number;
  };
};

export function useExerciseHistory(id: string) {
  return useQuery({
    queryKey: ["exercise-history", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ExerciseHistory>(
        `/exercises/${id}/history`,
      );
      return data;
    },
    enabled: Boolean(id),
  });
}
