"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarDays,
  Dumbbell,
  ImageIcon,
  LogOut,
  NotebookPen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/workouts", label: "Workouts", icon: NotebookPen },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/photos", label: "Photos", icon: ImageIcon },
];

const HIDE_ON_ROUTES = ["/login", "/register"];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";

  if (HIDE_ON_ROUTES.includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Dumbbell className="h-4 w-4 text-primary" />
          </span>
          <span className="hidden sm:inline">Gym Progress</span>
        </Link>

        {isAuthed && (
          <ul className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : isAuthed ? (
            <>
              <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground md:inline">
                {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
