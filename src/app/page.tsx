import Link from "next/link";
import { Dumbbell, CalendarDays, LineChart, ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Dumbbell,
    title: "Personal Exercise Library",
    desc: "Create, tag by muscle group & equipment, and reuse across workouts.",
    href: "/exercises",
  },
  {
    icon: LineChart,
    title: "Progress Logging",
    desc: "Track reps, weight, sets and see PRs trend over time.",
    href: "/workouts",
  },
  {
    icon: CalendarDays,
    title: "Calendar History",
    desc: "Review your discipline with a monthly calendar view of sessions.",
    href: "/calendar",
  },
  {
    icon: ImageIcon,
    title: "Progress Photos",
    desc: "Upload monthly photos and see your body transformation.",
    href: "/photos",
  },
];

export default async function Home() {
  const session = await auth();
  const isAuthed = Boolean(session?.user);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="mb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          Gym Progress Tracker
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight">
          Train smart. <span className="text-primary">Track everything.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Log workouts, build your exercise library, and watch your strength
          grow session after session.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={isAuthed ? "/workouts" : "/login"}>
              {isAuthed ? "Go to Workouts" : "Get started"}
            </Link>
          </Button>
          {!isAuthed && (
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.href} href={f.href}>
              <Card className="h-full transition-colors hover:border-primary/60">
                <CardHeader>
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2 text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
