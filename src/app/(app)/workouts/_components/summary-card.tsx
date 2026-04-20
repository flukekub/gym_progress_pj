import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  saving: boolean;
  hasDraft: boolean;
  onClear: () => void;
};

export function SummaryCard({
  exerciseCount,
  totalSets,
  totalVolume,
  saving,
  hasDraft,
  onClear,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Exercises</span>
          <span className="font-semibold">{exerciseCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total sets</span>
          <span className="font-semibold">{totalSets}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total volume</span>
          <span className="font-semibold">
            {totalVolume.toLocaleString()} kg
          </span>
        </div>

        <div className="space-y-2 pt-2">
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save workout"
            )}
          </Button>
          {hasDraft && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onClear}
                disabled={saving}
              >
                Clear draft
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Draft auto-saved locally
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
