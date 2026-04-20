"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type Exercise = {
  _id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  unit: string;
  notes?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseInput = {
  name: string;
  muscleGroup: string;
  equipment: string;
  unit: string;
  notes?: string;
};

const KEY = ["exercises"] as const;

export function useExercises(params?: { q?: string; muscleGroup?: string }) {
  return useQuery({
    queryKey: [...KEY, params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get<{ exercises: Exercise[] }>(
        "/exercises",
        { params }
      );
      return data.exercises;
    },
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExerciseInput) => {
      const { data } = await apiClient.post<{ exercise: Exercise }>(
        "/exercises",
        input
      );
      return data.exercise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<ExerciseInput> & { id: string }) => {
      const { data } = await apiClient.patch<{ exercise: Exercise }>(
        `/exercises/${id}`,
        input
      );
      return data.exercise;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/exercises/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
