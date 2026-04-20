"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  LineChart,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useCreateExercise,
  useDeleteExercise,
  useExercises,
  useUpdateExercise,
  type Exercise,
  type ExerciseInput,
} from "@/hooks/use-exercises";

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "glutes",
  "core",
  "cardio",
  "full_body",
  "other",
] as const;

const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "kettlebell",
  "bodyweight",
  "bands",
  "other",
] as const;

const UNITS = ["kg", "lb", "reps", "seconds", "minutes", "meters"] as const;

const emptyForm: ExerciseInput = {
  name: "",
  muscleGroup: "chest",
  equipment: "barbell",
  unit: "kg",
  notes: "",
};

export default function ExerciseLibraryPage() {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseInput>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useExercises({
    q: query || undefined,
    muscleGroup: muscleFilter || undefined,
  });

  const createMut = useCreateExercise();
  const updateMut = useUpdateExercise();
  const deleteMut = useDeleteExercise();

  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of exercises) {
      const arr = map.get(ex.muscleGroup) ?? [];
      arr.push(ex);
      map.set(ex.muscleGroup, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [exercises]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      unit: ex.unit,
      notes: ex.notes ?? "",
    });
    setDialogOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter an exercise name");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing._id, ...form });
        toast.success("Exercise updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Exercise added to your library");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete._id);
      toast.success("Exercise deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Dumbbell className="h-7 w-7 text-primary" />
            Personal Exercise Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your own catalog of exercises grouped by muscle and equipment.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit exercise" : "Add exercise"}
              </DialogTitle>
              <DialogDescription>
                Save custom exercises to your private library.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Incline Dumbbell Press"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="muscleGroup">Muscle group</Label>
                  <Select
                    id="muscleGroup"
                    value={form.muscleGroup}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, muscleGroup: e.target.value }))
                    }
                  >
                    {MUSCLE_GROUPS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="equipment">Equipment</Label>
                  <Select
                    id="equipment"
                    value={form.equipment}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, equipment: e.target.value }))
                    }
                  >
                    {EQUIPMENT.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  id="unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Technique cues, grip, tempo, etc."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {editing ? "Save changes" : "Add exercise"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
          className="md:w-56"
        >
          <option value="">All muscle groups</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, s) => (
            <section key={s}>
              <Skeleton className="mb-3 h-3 w-32" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-4/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              Your library is empty. Add your first exercise to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {group.replace("_", " ")} · {items.length}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((ex) => (
                  <Card
                    key={ex._id}
                    className="transition-colors hover:border-primary/60"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{ex.name}</CardTitle>
                      <CardDescription>
                        {ex.equipment} · {ex.unit}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {ex.notes || "No notes"}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          aria-label="View history"
                        >
                          <Link href={`/exercises/${ex._id}`}>
                            <LineChart className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(ex)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setPendingDelete(ex)}
                          aria-label="Delete"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete exercise?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed from your library. Existing workout logs will keep their reference but may show "Unknown exercise".`
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
