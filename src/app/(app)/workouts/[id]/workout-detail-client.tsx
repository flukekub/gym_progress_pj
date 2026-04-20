"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useDeleteWorkoutLog,
  useWorkoutLog,
} from "@/hooks/use-workout-logs";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const { data: log, isLoading, isError } = useWorkoutLog(id);
  const deleteMut = useDeleteWorkoutLog();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = async () => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Workout deleted");
      router.push("/calendar");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Workout not found.
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/calendar">
                  <ArrowLeft className="h-4 w-4" /> Back to calendar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSets = log?.exercises.reduce(
    (a, ex) => a + ex.sets.length,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/calendar">
          <ArrowLeft className="h-4 w-4" /> Back to calendar
        </Link>
      </Button>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {isLoading || !log ? (
            <>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="mt-2 h-4 w-40" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                {log.title || "Workout"}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(log.date), "EEEE, MMM d yyyy")}
              </p>
            </>
          )}
        </div>
        {log && (
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete workout
          </Button>
        )}
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Dumbbell}
          label="Exercises"
          value={log?.exercises.length}
          loading={isLoading}
        />
        <StatCard
          icon={Flame}
          label="Total volume"
          value={
            log ? `${log.totalVolume.toLocaleString()} kg` : undefined
          }
          loading={isLoading}
        />
        <StatCard
          icon={Clock}
          label="Duration"
          value={log?.durationMin ? `${log.durationMin} min` : "—"}
          loading={isLoading}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Exercises · {totalSets ?? 0} total sets
        </h2>

        {isLoading || !log ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {log.exercises.map((ex, idx) => {
              const populated =
                ex.exerciseId && typeof ex.exerciseId === "object"
                  ? ex.exerciseId
                  : null;
              const name =
                populated?.name ?? ex.exerciseName ?? "Deleted exercise";
              const unit = populated?.unit ?? "kg";
              const isDeleted = !populated;
              const exerciseId = populated?._id;

              const exVolume = ex.sets.reduce(
                (a, s) =>
                  s.reps && s.weight ? a + s.reps * s.weight : a,
                0,
              );

              return (
                <Card key={idx}>
                  <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">
                        {idx + 1}. {name}
                        {isDeleted && (
                          <span className="ml-2 text-xs font-normal italic text-muted-foreground">
                            (deleted)
                          </span>
                        )}
                      </CardTitle>
                      {populated ? (
                        <CardDescription>
                          {populated.muscleGroup}
                          {populated.equipment
                            ? ` · ${populated.equipment}`
                            : ""}
                        </CardDescription>
                      ) : null}
                    </div>
                    {exerciseId && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/exercises/${exerciseId}`}>
                          History <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 border-b border-border pb-1 text-xs font-medium uppercase text-muted-foreground">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight</span>
                      <span>RPE</span>
                    </div>
                    {ex.sets.map((s, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 border-b border-border/50 py-1.5 text-sm last:border-0"
                      >
                        <span className="font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span>{s.reps ?? "—"}</span>
                        <span>
                          {s.weight != null ? `${s.weight} ${unit}` : "—"}
                        </span>
                        <span className="text-muted-foreground">
                          {s.rpe ?? "—"}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ex.sets.length} sets</span>
                      <span>
                        Volume:{" "}
                        <span className="font-semibold text-foreground">
                          {exVolume.toLocaleString()} {unit}
                        </span>
                      </span>
                    </div>
                    {ex.note ? (
                      <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Note:</span> {ex.note}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this workout?"
        description={
          log
            ? `The workout from ${format(
                new Date(log.date),
                "PPP",
              )} will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmText="Delete"
        variant="destructive"
        loading={deleteMut.isPending}
        onConfirm={onDelete}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-16" />
          ) : (
            <p className="truncate text-lg font-semibold">{value ?? "—"}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
