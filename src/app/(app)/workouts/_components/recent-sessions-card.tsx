import Link from "next/link";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkoutLog } from "@/hooks/use-workout-logs";

type Props = {
  logs: WorkoutLog[];
  loading: boolean;
};

export function RecentSessionsCard({ logs, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent sessions</CardTitle>
        <CardDescription>Your last 5 workouts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
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
            <Link
              key={log._id}
              href={`/workouts/${log._id}`}
              className="block rounded-md border border-border p-2 text-sm transition-colors hover:border-primary/60 hover:bg-accent/40"
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
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
