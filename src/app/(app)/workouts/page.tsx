"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Dumbbell, Loader2, Plus, Trash2, X } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useExercises, type Exercise } from "@/hooks/use-exercises";
import {
  useCreateWorkoutLog,
  useWorkoutLogs,
  type WorkoutSet,
} from "@/hooks/use-workout-logs";

type DraftExercise = {
  key: string;
  exerciseId: string;
  sets: WorkoutSet[];
  note: string;
};

const newSet = (): WorkoutSet => ({
  reps: undefined,
  weight: undefined,
  rpe: undefined,
  completed: true,
});

const makeDraft = (exerciseId: string): DraftExercise => ({
  key: `${exerciseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  exerciseId,
  sets: [newSet(), newSet(), newSet()],
  note: "",
});

export default function WorkoutsPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [drafts, setDrafts] = useState<DraftExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const { data: exercises = [], isLoading: loadingExercises } = useExercises();
  const { data: logs = [], isLoading: loadingLogs } = useWorkoutLogs();
  const createMut = useCreateWorkoutLog();

  const exerciseMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const ex of exercises) m.set(ex._id, ex);
    return m;
  }, [exercises]);

  const addExercise = () => {
    if (!selectedExerciseId) {
      toast.error("Select an exercise first");
      return;
    }
    setDrafts((ds) => [...ds, makeDraft(selectedExerciseId)]);
    setSelectedExerciseId("");
  };

  const removeDraft = (key: string) =>
    setDrafts((ds) => ds.filter((d) => d.key !== key));

  const updateDraft = (key: string, patch: Partial<DraftExercise>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const updateSet = (key: string, index: number, patch: Partial<WorkoutSet>) =>
    setDrafts((ds) =>
      ds.map((d) =>
        d.key === key
          ? {
              ...d,
              sets: d.sets.map((s, i) =>
                i === index ? { ...s, ...patch } : s,
              ),
            }
          : d,
      ),
    );

  const addSet = (key: string) =>
    setDrafts((ds) =>
      ds.map((d) =>
        d.key === key ? { ...d, sets: [...d.sets, newSet()] } : d,
      ),
    );

  const removeSet = (key: string, index: number) =>
    setDrafts((ds) =>
      ds.map((d) =>
        d.key === key
          ? { ...d, sets: d.sets.filter((_, i) => i !== index) }
          : d,
      ),
    );

  const totalVolume = useMemo(() => {
    return drafts.reduce((acc, d) => {
      return (
        acc +
        d.sets.reduce((s, set) => {
          if (set.reps && set.weight) return s + set.reps * set.weight;
          return s;
        }, 0)
      );
    }, 0);
  }, [drafts]);

  const reset = () => {
    setTitle("");
    setDurationMin("");
    setDrafts([]);
    setSelectedExerciseId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (drafts.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    const hasInvalid = drafts.some(
      (d) => d.sets.length === 0 || d.sets.every((s) => !s.reps && !s.weight),
    );
    if (hasInvalid) {
      toast.error("Each exercise needs at least one filled set");
      return;
    }

    try {
      await createMut.mutateAsync({
        date,
        title: title.trim() || undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        exercises: drafts.map((d, idx) => ({
          exerciseId: d.exerciseId,
          order: idx,
          note: d.note.trim() || undefined,
          sets: d.sets
            .filter((s) => s.reps || s.weight || s.durationSec)
            .map((s) => ({
              reps: s.reps,
              weight: s.weight,
              rpe: s.rpe,
              completed: s.completed,
            })),
        })),
      });
      toast.success("Workout logged!");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Dumbbell className="h-7 w-7 text-primary" />
            Log a Workout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record sets, reps, and weights for today&apos;s session.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/calendar">
            <CalendarDays className="h-4 w-4" />
            View calendar
          </Link>
        </Button>
      </header>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session info</CardTitle>
              <CardDescription>
                Pick a date and (optionally) name this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Push day, Leg day, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  placeholder="60"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add exercise</CardTitle>
              <CardDescription>
                Pick from your library, then record sets below.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="flex-1"
                disabled={loadingExercises}
              >
                <option value="">
                  {loadingExercises
                    ? "Loading exercises..."
                    : exercises.length === 0
                      ? "No exercises yet — add one in the Library"
                      : "Select an exercise..."}
                </option>
                {exercises.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.name} ({ex.muscleGroup})
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                onClick={addExercise}
                disabled={!selectedExerciseId}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardContent>
          </Card>

          {drafts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No exercises added yet.{" "}
                {exercises.length === 0 && (
                  <>
                    Head to the{" "}
                    <Link
                      href="/exercises"
                      className="text-primary hover:underline"
                    >
                      Exercise Library
                    </Link>{" "}
                    to create your first one.
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            drafts.map((d, idx) => {
              const ex = exerciseMap.get(d.exerciseId);
              const weightLabel =
                ex?.unit === "lb" ? "Weight (lb)" : "Weight (kg)";
              return (
                <Card key={d.key}>
                  <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                    <div>
                      <CardTitle className="text-base">
                        {idx + 1}. {ex?.name ?? "Unknown exercise"}
                      </CardTitle>
                      <CardDescription>
                        {ex
                          ? `${ex.muscleGroup} · ${ex.equipment}`
                          : "Exercise unavailable"}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDraft(d.key)}
                      aria-label="Remove exercise"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>{weightLabel}</span>
                      <span>RPE</span>
                      <span />
                    </div>
                    {d.sets.map((s, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2"
                      >
                        <span className="text-sm font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="10"
                          value={s.reps ?? ""}
                          onChange={(e) =>
                            updateSet(d.key, i, {
                              reps:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          placeholder="60"
                          value={s.weight ?? ""}
                          onChange={(e) =>
                            updateSet(d.key, i, {
                              weight:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step="0.5"
                          placeholder="7"
                          value={s.rpe ?? ""}
                          onChange={(e) =>
                            updateSet(d.key, i, {
                              rpe:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSet(d.key, i)}
                          aria-label="Remove set"
                          disabled={d.sets.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(d.key)}
                      >
                        <Plus className="h-4 w-4" /> Add set
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`note-${d.key}`} className="text-xs">
                        Note
                      </Label>
                      <Textarea
                        id={`note-${d.key}`}
                        placeholder="How did it feel? Tempo, form cues, etc."
                        value={d.note}
                        onChange={(e) =>
                          updateDraft(d.key, { note: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exercises</span>
                <span className="font-semibold">{drafts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total sets</span>
                <span className="font-semibold">
                  {drafts.reduce((a, d) => a + d.sets.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total volume</span>
                <span className="font-semibold">
                  {totalVolume.toLocaleString()} kg
                </span>
              </div>
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMut.isPending}
                >
                  {createMut.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save workout"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent sessions</CardTitle>
              <CardDescription>Your last 5 workouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingLogs ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-md border border-border p-2"
                  >
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No workouts logged yet.
                </p>
              ) : (
                logs.slice(0, 5).map((log) => (
                  <div
                    key={log._id}
                    className="rounded-md border border-border p-2 text-sm"
                  >
                    <div className="flex justify-between font-medium">
                      <span>{log.title || "Workout"}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(log.date), "MMM d")}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {log.exercises.length} exercises ·{" "}
                      {log.totalVolume.toLocaleString()} kg
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
