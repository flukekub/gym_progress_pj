"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Dumbbell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useExercises, type Exercise } from "@/hooks/use-exercises";
import {
  useCreateWorkoutLog,
  useWorkoutLogs,
  type WorkoutSet,
} from "@/hooks/use-workout-logs";

import { SessionInfoCard } from "./_components/session-info-card";
import { ExercisePickerCard } from "./_components/exercise-picker-card";
import { ExerciseDraftCard } from "./_components/exercise-draft-card";
import { SummaryCard } from "./_components/summary-card";
import { RecentSessionsCard } from "./_components/recent-sessions-card";
import {
  makeDraft,
  newSet,
  type DraftExercise,
} from "./_components/draft-types";

const DRAFT_KEY = "gym-progress:workout-draft:v1";

type PersistedDraft = {
  date: string;
  title: string;
  durationMin: string;
  drafts: DraftExercise[];
};

export default function WorkoutsClient() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [drafts, setDrafts] = useState<DraftExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<PersistedDraft>;
        if (saved.date) setDate(saved.date);
        if (saved.title) setTitle(saved.title);
        if (saved.durationMin) setDurationMin(saved.durationMin);
        if (Array.isArray(saved.drafts)) setDrafts(saved.drafts);
      }
    } catch {
      // ignore corrupted draft
    }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated) return;
    const isEmpty =
      drafts.length === 0 && !title && !durationMin && date === today;
    try {
      if (isEmpty) {
        localStorage.removeItem(DRAFT_KEY);
      } else {
        const payload: PersistedDraft = { date, title, durationMin, drafts };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      }
    } catch {
      // ignore quota errors
    }
  }, [hydrated, date, title, durationMin, drafts, today]);

  const { data: exercises = [], isLoading: loadingExercises } = useExercises();
  const { data: logs = [], isLoading: loadingLogs } = useWorkoutLogs();
  const createMut = useCreateWorkoutLog();

  const exerciseMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const ex of exercises) m.set(ex._id, ex);
    return m;
  }, [exercises]);

  // --- draft mutation helpers ---------------------------------------------

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

  const updateSet = (
    key: string,
    index: number,
    patch: Partial<WorkoutSet>,
  ) =>
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

  const setNote = (key: string, note: string) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, note } : d)));

  // --- derived ------------------------------------------------------------

  const hasDraft =
    drafts.length > 0 ||
    Boolean(title) ||
    Boolean(durationMin) ||
    date !== today;

  const totalSets = drafts.reduce((a, d) => a + d.sets.length, 0);

  const totalVolume = useMemo(
    () =>
      drafts.reduce(
        (acc, d) =>
          acc +
          d.sets.reduce(
            (s, set) =>
              set.reps && set.weight ? s + set.reps * set.weight : s,
            0,
          ),
        0,
      ),
    [drafts],
  );

  // --- actions ------------------------------------------------------------

  const reset = () => {
    setTitle("");
    setDurationMin("");
    setDrafts([]);
    setSelectedExerciseId("");
    setDate(today);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // noop
    }
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

  // --- render -------------------------------------------------------------

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
          <SessionInfoCard
            date={date}
            title={title}
            durationMin={durationMin}
            onDateChange={setDate}
            onTitleChange={setTitle}
            onDurationChange={setDurationMin}
          />

          <ExercisePickerCard
            exercises={exercises}
            loading={loadingExercises}
            selectedId={selectedExerciseId}
            onSelectedIdChange={setSelectedExerciseId}
            onAdd={addExercise}
          />

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
            drafts.map((d, idx) => (
              <ExerciseDraftCard
                key={d.key}
                index={idx}
                draft={d}
                exercise={exerciseMap.get(d.exerciseId)}
                onRemove={() => removeDraft(d.key)}
                onAddSet={() => addSet(d.key)}
                onRemoveSet={(i) => removeSet(d.key, i)}
                onUpdateSet={(i, patch) => updateSet(d.key, i, patch)}
                onNoteChange={(note) => setNote(d.key, note)}
              />
            ))
          )}
        </div>

        <aside className="space-y-6">
          <SummaryCard
            exerciseCount={drafts.length}
            totalSets={totalSets}
            totalVolume={totalVolume}
            saving={createMut.isPending}
            hasDraft={hasDraft}
            onClear={reset}
          />

          <RecentSessionsCard logs={logs} loading={loadingLogs} />
        </aside>
      </form>
    </div>
  );
}
