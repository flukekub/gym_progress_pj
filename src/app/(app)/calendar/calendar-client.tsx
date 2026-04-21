"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Plus,
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
import { cn } from "@/lib/utils";
import { useWorkoutLogs, type WorkoutLog } from "@/hooks/use-workout-logs";
import { useCalorieLogs, useSaveCalorieLog } from "@/hooks/use-calorie-logs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const { data: logs = [], isLoading } = useWorkoutLogs({
    from: format(gridStart, "yyyy-MM-dd"),
    to: format(gridEnd, "yyyy-MM-dd"),
  });

  const { data: calorieLogs = [] } = useCalorieLogs({
    from: format(gridStart, "yyyy-MM-dd"),
    to: format(gridEnd, "yyyy-MM-dd"),
  });

  const saveCalorieMut = useSaveCalorieLog();
  const [calorieInput, setCalorieInput] = useState<string>("");

  const logsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const log of logs) {
      const key = format(new Date(log.date), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(log);
      map.set(key, arr);
    }
    return map;
  }, [logs]);

  const caloriesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of calorieLogs) {
      const key = format(new Date(log.date), "yyyy-MM-dd");
      map.set(key, log.caloriesBurned);
    }
    return map;
  }, [calorieLogs]);

  const weeks = useMemo(() => {
    const res = [];
    for (let i = 0; i < days.length; i += 7) {
      res.push(days.slice(i, i + 7));
    }
    return res;
  }, [days]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedLogs = logsByDate.get(selectedKey) ?? [];
  const selectedCalories = caloriesByDate.get(selectedKey);

  const monthLogsCount = logs.filter((l) =>
    isSameMonth(new Date(l.date), cursor),
  ).length;

  useEffect(() => {
    setCalorieInput(selectedCalories?.toString() ?? "");
  }, [selectedCalories, selectedKey]);

  const handleSaveCalories = async () => {
    if (!calorieInput) return;
    try {
      await saveCalorieMut.mutateAsync({
        date: selectedKey,
        caloriesBurned: Number(calorieInput),
      });
      toast.success("Calories saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save calories",
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <CalendarDays className="h-7 w-7 text-primary" />
            Workout Calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review your discipline and spot the days you missed.
          </p>
        </div>
        <Button asChild>
          <Link href="/workouts">
            <Plus className="h-4 w-4" /> Log workout
          </Link>
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">
                {format(cursor, "MMMM yyyy")}
              </CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-3 w-28" />
                ) : (
                  `${monthLogsCount} workout${
                    monthLogsCount === 1 ? "" : "s"
                  } this month`
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCursor((c) => subMonths(c, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  setCursor(startOfMonth(now));
                  setSelected(now);
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCursor((c) => addMonths(c, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[repeat(7,1fr)_auto] gap-1 pb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
              <div className="w-16 ml-2 text-primary/70">Avg kcal</div>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {weeks.map((week, idx) => {
                const totalCalories = week.reduce(
                  (sum, day) =>
                    sum + (caloriesByDate.get(format(day, "yyyy-MM-dd")) || 0),
                  0,
                );
                const avgCalories = Math.round(totalCalories / 7);

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[repeat(7,1fr)_auto] gap-1"
                  >
                    {week.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const dayLogs = logsByDate.get(key) ?? [];
                      const inMonth = isSameMonth(day, cursor);
                      const isSelected = isSameDay(day, selected);
                      const hasLog = dayLogs.length > 0;

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSelected(day)}
                          className={cn(
                            "relative flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors",
                            inMonth
                              ? "border-border"
                              : "border-transparent text-muted-foreground/60",
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "hover:bg-accent/60",
                            isToday(day) &&
                              !isSelected &&
                              "border-primary/50 text-primary",
                          )}
                        >
                          <span className="font-medium">
                            {format(day, "d")}
                          </span>
                          {hasLog && (
                            <span
                              className={cn(
                                "absolute bottom-1.5 h-1.5 w-1.5 rounded-full",
                                isSelected ? "bg-primary" : "bg-primary/80",
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                    <div className="flex w-16 ml-2 items-center justify-center rounded-md border border-transparent text-xs font-semibold text-primary bg-primary/5">
                      {avgCalories > 0 ? `${avgCalories}` : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <aside>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selected, "EEEE, MMM d")}
              </CardTitle>
              <CardDescription>
                {selectedLogs.length === 0
                  ? "Rest day — no workouts logged."
                  : `${selectedLogs.length} session${
                      selectedLogs.length === 1 ? "" : "s"
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 border-b border-border pb-4">
                <label className="text-sm font-medium">
                  Daily Calories (kcal)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="E.g., 500"
                    value={calorieInput}
                    onChange={(e) => setCalorieInput(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveCalories}
                    disabled={
                      saveCalorieMut.isPending ||
                      (!calorieInput && !selectedCalories)
                    }
                  >
                    {saveCalorieMut.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
              {selectedLogs.length === 0 ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/workouts">
                    <Dumbbell className="h-4 w-4" /> Log a workout
                  </Link>
                </Button>
              ) : (
                selectedLogs.map((log) => {
                  const totalSets = log.exercises.reduce(
                    (a, ex) => a + ex.sets.length,
                    0,
                  );
                  return (
                    <Link
                      key={log._id}
                      href={`/workouts/${log._id}`}
                      className="block rounded-md border border-border p-3 transition-colors hover:border-primary/60 hover:bg-accent/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="flex items-center gap-1 font-semibold">
                          {log.title || "Workout"}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </h3>
                        {log.durationMin ? (
                          <span className="text-xs text-muted-foreground">
                            {log.durationMin} min
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {log.exercises.length} exercises · {totalSets} sets ·{" "}
                        {log.totalVolume.toLocaleString()} kg
                      </div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {log.exercises.map((ex, i) => {
                          const populatedName =
                            ex.exerciseId && typeof ex.exerciseId === "object"
                              ? ex.exerciseId.name
                              : undefined;
                          const name =
                            populatedName ??
                            ex.exerciseName ??
                            "Deleted exercise";
                          const isDeleted = !populatedName;
                          return (
                            <li
                              key={i}
                              className={cn(
                                "flex justify-between text-muted-foreground",
                                isDeleted && "italic opacity-70",
                              )}
                              title={
                                isDeleted
                                  ? "This exercise was deleted from your library"
                                  : undefined
                              }
                            >
                              <span className="truncate">{name}</span>
                              <span className="shrink-0 text-xs">
                                {ex.sets.length} sets
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
