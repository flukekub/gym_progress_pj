# Gym Progress Tracker

A workout progress-tracking web app built with **Next.js 14 App Router** (full-stack),
**MongoDB + Mongoose**, **Auth.js v5** (credentials), **TanStack Query + Axios**,
**Tailwind CSS v4**, and **shadcn/radix UI** — all in TypeScript with a dark theme.

## Features

- Account registration & credential login (Auth.js)
- User profile with weight / height / birth date
- Personal Exercise Library — CRUD with muscle group, equipment, unit, notes
- Workout logging (sets, reps, weight, RPE, duration) with auto-calculated volume
- Calendar view of workout history (page scaffold)
- Progress photo uploads (page scaffold)
- Per-exercise statistics (page scaffold)

## Getting started (Bun)

```bash
bun install

# Create env file
cp .env.example .env.local
# Edit .env.local and set MONGODB_URI + AUTH_SECRET

# Dev server
bun run dev

# Production
bun run build
bun run start
```

> Generate `AUTH_SECRET` with: `bunx auth secret` or `openssl rand -base64 32`.

## Folder structure

```
d:\gym_progress_pj\
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout + <Providers>
│  │  ├─ page.tsx                # Landing page
│  │  ├─ providers.tsx           # SessionProvider + QueryClientProvider + Toaster
│  │  ├─ globals.css             # Tailwind v4 @theme tokens (dark)
│  │  ├─ (app)/
│  │  │  └─ exercises/
│  │  │     └─ page.tsx          # Personal Exercise Library UI
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts   # Auth.js handlers
│  │     ├─ register/route.ts              # POST /api/register
│  │     ├─ exercises/
│  │     │  ├─ route.ts                    # GET / POST exercises
│  │     │  └─ [id]/route.ts               # PATCH / DELETE exercise
│  │     └─ workout-logs/route.ts          # POST / GET workout logs
│  ├─ components/
│  │  └─ ui/                     # button, card, dialog, input, label, select, textarea
│  ├─ hooks/
│  │  └─ use-exercises.ts        # TanStack Query hooks for the Library
│  ├─ lib/
│  │  ├─ auth.ts                 # NextAuth config (credentials provider)
│  │  ├─ mongodb.ts              # Mongoose connection (cached)
│  │  ├─ api-client.ts           # Axios instance
│  │  └─ utils.ts                # cn()
│  ├─ models/
│  │  ├─ User.ts
│  │  ├─ Exercise.ts
│  │  └─ WorkoutLog.ts
│  └─ types/
│     └─ next-auth.d.ts          # Session typing (user.id)
├─ .env.example
├─ next.config.mjs
├─ postcss.config.mjs            # @tailwindcss/postcss
├─ tsconfig.json
└─ package.json
```

## MongoDB schemas

See `src/models/`:

- `User` — email, name, passwordHash, heightCm, weightKg, birthDate.
- `Exercise` — userId-scoped; name, muscleGroup, equipment, unit, notes, isCustom. Unique on `(userId, name)`.
- `WorkoutLog` — userId, date, title, `exercises[]` (exerciseId, order, `sets[]`, note), totalVolume, durationMin.

## Sample API: log a workout

`POST /api/workout-logs` (see `src/app/api/workout-logs/route.ts`)

```json
{
  "date": "2026-04-20",
  "title": "Push day",
  "durationMin": 65,
  "exercises": [
    {
      "exerciseId": "665f...e1",
      "order": 0,
      "sets": [
        { "reps": 10, "weight": 60, "rpe": 7, "completed": true },
        { "reps": 8,  "weight": 65, "rpe": 8, "completed": true },
        { "reps": 6,  "weight": 70, "rpe": 9, "completed": true }
      ],
      "note": "Focus on scapular retraction"
    }
  ]
}
```

The route auto-computes `totalVolume = Σ (reps × weight)`.

## Personal Exercise Library page

`src/app/(app)/exercises/page.tsx` — search, filter by muscle group,
create/edit/delete exercises via a Dialog form, grouped card grid, built
entirely with TanStack Query + Axios against `/api/exercises`.

## Notes

- Tailwind v4 is configured via `@import "tailwindcss"` and `@theme` tokens in
  `src/app/globals.css`; no `tailwind.config.ts` is needed.
- Auth.js v5 is set up with JWT sessions and a credentials provider that looks
  up the user in MongoDB and verifies `bcrypt` hashes.
- Protect routes by calling `await auth()` inside API routes (already done in
  `/api/exercises` and `/api/workout-logs`).
