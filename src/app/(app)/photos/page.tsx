"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useDeleteProgressPhoto,
  useProgressPhotos,
  useUploadProgressPhoto,
  type ProgressPhoto,
} from "@/hooks/use-progress-photos";

const MAX_MB = 10;

export default function ProgressPhotosPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ProgressPhoto | null>(
    null,
  );

  const { data: photos = [], isLoading } = useProgressPhotos();
  const uploadMut = useUploadProgressPhoto();
  const deleteMut = useDeleteProgressPhoto();

  const grouped = useMemo(() => {
    const m = new Map<string, ProgressPhoto[]>();
    for (const p of photos) {
      const key = format(new Date(p.takenAt), "yyyy-MM");
      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [photos]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_MB} MB)`);
      return;
    }
    setFile(f);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  const resetForm = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setWeightKg("");
    setNotes("");
    setTakenAt(format(new Date(), "yyyy-MM-dd"));
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose a photo first");
      return;
    }
    try {
      await uploadMut.mutateAsync({
        file,
        takenAt,
        weightKg: weightKg ? Number(weightKg) : undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Photo uploaded");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete._id);
      toast.success("Photo deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ImagePlus className="h-7 w-7 text-primary" />
          Progress Photos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your physical transformation month by month.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Upload new photo</CardTitle>
            <CardDescription>
              JPG / PNG / WEBP up to {MAX_MB} MB.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Photo</Label>
                <input
                  ref={fileRef}
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/avif"
                  onChange={onFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              {previewUrl && (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    sizes="380px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="takenAt">Taken on</Label>
                <Input
                  id="takenAt"
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="weightKg">Weight (kg) — optional</Label>
                <Input
                  id="weightKg"
                  type="number"
                  min={20}
                  max={500}
                  step="0.1"
                  placeholder="70"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes — optional</Label>
                <Textarea
                  id="notes"
                  placeholder="Bulking week 4, fasted morning, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploadMut.isPending || !file}
              >
                {uploadMut.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        <div className="space-y-8">
          {isLoading ? (
            <section>
              <Skeleton className="mb-3 h-3 w-40" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[3/4] w-full rounded-none" />
                    <CardContent className="space-y-1.5 p-2">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : photos.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  No photos yet. Upload your first one to start your timeline.
                </p>
              </CardContent>
            </Card>
          ) : (
            grouped.map(([ym, items]) => (
              <section key={ym}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {format(new Date(`${ym}-01`), "MMMM yyyy")} · {items.length}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {items.map((p) => (
                    <Card key={p._id} className="overflow-hidden">
                      <div className="relative aspect-[3/4] bg-muted">
                        {p.url ? (
                          <Image
                            src={p.url}
                            alt={`Progress on ${format(
                              new Date(p.takenAt),
                              "PPP",
                            )}`}
                            fill
                            loading="lazy"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            URL expired
                          </div>
                        )}
                      </div>
                      <CardContent className="space-y-0.5 p-2">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-medium">
                            {format(new Date(p.takenAt), "PP")}
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPendingDelete(p)}
                            aria-label="Delete photo"
                            className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {p.weightKg ? (
                          <p className="text-[11px] text-muted-foreground">
                            {p.weightKg} kg
                          </p>
                        ) : null}
                        {p.notes ? (
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">
                            {p.notes}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this photo?"
        description={
          pendingDelete
            ? `Photo from ${format(
                new Date(pendingDelete.takenAt),
                "PPP",
              )} will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmText="Delete"
        variant="destructive"
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
