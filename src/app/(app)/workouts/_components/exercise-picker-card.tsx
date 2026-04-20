import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { Exercise } from "@/hooks/use-exercises";

type Props = {
  exercises: Exercise[];
  loading: boolean;
  selectedId: string;
  onSelectedIdChange: (v: string) => void;
  onAdd: () => void;
};

export function ExercisePickerCard({
  exercises,
  loading,
  selectedId,
  onSelectedIdChange,
  onAdd,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add exercise</CardTitle>
        <CardDescription>
          Pick from your library, then record sets below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={selectedId}
          onChange={(e) => onSelectedIdChange(e.target.value)}
          className="flex-1"
          disabled={loading}
        >
          <option value="">
            {loading
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
        <Button type="button" onClick={onAdd} disabled={!selectedId}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardContent>
    </Card>
  );
}
