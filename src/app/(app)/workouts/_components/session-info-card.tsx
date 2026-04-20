import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  date: string;
  title: string;
  durationMin: string;
  onDateChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onDurationChange: (v: string) => void;
};

export function SessionInfoCard({
  date,
  title,
  durationMin,
  onDateChange,
  onTitleChange,
  onDurationChange,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Session info</CardTitle>
        <CardDescription>
          Pick a date and (optionally) name this session.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Push day, Leg day, etc."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="duration">Duration (min)</Label>
          <Input
            id="duration"
            type="number"
            min={0}
            placeholder="60"
            value={durationMin}
            onChange={(e) => onDurationChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
