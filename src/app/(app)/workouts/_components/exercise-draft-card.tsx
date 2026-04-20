import { Plus, Trash2, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import type { Exercise } from "@/hooks/use-exercises";
import type { WorkoutSet } from "@/hooks/use-workout-logs";
import type { DraftExercise } from "./draft-types";

type Props = {
  index: number;
  draft: DraftExercise;
  exercise?: Exercise;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, patch: Partial<WorkoutSet>) => void;
  onNoteChange: (note: string) => void;
};

const toNumberOrUndefined = (v: string) =>
  v === "" ? undefined : Number(v);

export function ExerciseDraftCard({
  index,
  draft,
  exercise,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onNoteChange,
}: Props) {
  const weightLabel =
    exercise?.unit === "lb" ? "Weight (lb)" : "Weight (kg)";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">
            {index + 1}. {exercise?.name ?? "Unknown exercise"}
          </CardTitle>
          <CardDescription>
            {exercise
              ? `${exercise.muscleGroup} · ${exercise.equipment}`
              : "Exercise unavailable"}
          </CardDescription>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
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

        {draft.sets.map((s, i) => (
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
                onUpdateSet(i, { reps: toNumberOrUndefined(e.target.value) })
              }
            />
            <Input
              type="number"
              min={0}
              step="0.5"
              placeholder="60"
              value={s.weight ?? ""}
              onChange={(e) =>
                onUpdateSet(i, { weight: toNumberOrUndefined(e.target.value) })
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
                onUpdateSet(i, { rpe: toNumberOrUndefined(e.target.value) })
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onRemoveSet(i)}
              aria-label="Remove set"
              disabled={draft.sets.length === 1}
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
            onClick={onAddSet}
          >
            <Plus className="h-4 w-4" /> Add set
          </Button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`note-${draft.key}`} className="text-xs">
            Note
          </Label>
          <Textarea
            id={`note-${draft.key}`}
            placeholder="How did it feel? Tempo, form cues, etc."
            value={draft.note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
