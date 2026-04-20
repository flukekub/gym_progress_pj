"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type ProgressPhoto = {
  _id: string;
  storagePath: string;
  takenAt: string;
  weightKg?: number;
  notes?: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  createdAt: string;
};

export type UploadPhotoInput = {
  file: File;
  takenAt?: string; // yyyy-mm-dd
  weightKg?: number;
  notes?: string;
};

const KEY = ["progress-photos"] as const;

export function useProgressPhotos() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<{ photos: ProgressPhoto[] }>(
        "/progress-photos"
      );
      return data.photos;
    },
  });
}

export function useUploadProgressPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadPhotoInput) => {
      const fd = new FormData();
      fd.append("file", input.file);
      if (input.takenAt) fd.append("takenAt", input.takenAt);
      if (input.weightKg !== undefined)
        fd.append("weightKg", String(input.weightKg));
      if (input.notes) fd.append("notes", input.notes);

      const { data } = await apiClient.post<{ photo: ProgressPhoto }>(
        "/progress-photos",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.photo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteProgressPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/progress-photos/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
