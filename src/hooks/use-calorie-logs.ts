"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type CalorieLog = {
  _id: string;
  userId: string;
  date: string;
  caloriesBurned: number;
  createdAt: string;
  updatedAt: string;
};

export type CalorieLogInput = {
  date: string;
  caloriesBurned: number;
};

const KEY = ["calorie-logs"] as const;

export function useCalorieLogs(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [...KEY, params ?? {}],
    queryFn: async () => {
      const { data } = await apiClient.get<{ logs: CalorieLog[] }>(
        "/calorie-logs",
        { params },
      );
      return data.logs;
    },
  });
}

export function useSaveCalorieLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CalorieLogInput) => {
      const { data } = await apiClient.post<{ log: CalorieLog }>(
        "/calorie-logs",
        input,
      );
      return data.log;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
