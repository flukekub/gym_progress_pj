"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Dumbbell,
  Flame,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExerciseHistory } from "@/hooks/use-exercise-history";

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data, isLoading, isError } = useExerciseHistory(id);

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Exercise not found or you don&apos;t have access.
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/exercises">
                  <ArrowLeft className="h-4 w-4" /> Back to library
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unit = data?.exercise.unit ?? "kg";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/exercises">
          <ArrowLeft className="h-4 w-4" /> Back to library
        </Link>
      </Button>

      <header className="mb-8">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </>
        ) : (
          <>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Dumbbell className="h-7 w-7 text-primary" />
              {data.exercise.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.exercise.muscleGroup} · {data.exercise.equipment}
            </p>
            {data.exercise.notes ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {data.exercise.notes}
              </p>
            ) : null}
          </>
        )}
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Sessions"
          value={data?.stats.totalSessions}
          loading={isLoading}
        />
        <StatCard
          icon={Trophy}
          label="Heaviest set"
          value={
            data?.stats.bestWeight
              ? `${data.stats.bestWeight} ${unit}`
              : "—"
          }
          loading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Est. 1RM"
          value={
            data?.stats.bestE1RM
              ? `${data.stats.bestE1RM} ${unit}`
              : "—"
          }
          loading={isLoading}
        />
        <StatCard
          icon={Flame}
          label="Total volume"
          value={
            data?.stats.totalVolume
              ? `${data.stats.totalVolume.toLocaleString()} ${unit}`
              : "—"
          }
          loading={isLoading}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          History
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !data || data.sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No sessions logged with this exercise yet.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/workouts">
                    Log a workout <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.sessions.map((s) => (
              <Card key={s.logId}>
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">
                      {format(new Date(s.date), "EEE, MMM d yyyy")}
                    </CardTitle>
                    {s.title ? (
                      <CardDescription>{s.title}</CardDescription>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>
                      Volume:{" "}
                      <span className="font-semibold text-foreground">
                        {s.volume.toLocaleString()} {unit}
                      </span>
                    </div>
                    {s.bestWeight > 0 && (
                      <div>
                        Top set:{" "}
                        <span className="font-semibold text-foreground">
                          {s.bestWeight} {unit}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 border-b border-border pb-1 text-xs font-medium uppercase text-muted-foreground">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight</span>
                    <span>RPE</span>
                  </div>
                  {s.sets.map((set, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[2rem_1fr_1fr_1fr] items-center gap-2 border-b border-border/50 py-1.5 text-sm last:border-0"
                    >
                      <span className="font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span>{set.reps ?? "—"}</span>
                      <span>
                        {set.weight != null ? `${set.weight} ${unit}` : "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {set.rpe ?? "—"}
                      </span>
                    </div>
                  ))}
                  {s.note ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Note:</span> {s.note}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
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
