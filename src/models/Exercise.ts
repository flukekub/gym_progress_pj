import mongoose, { Schema, Model, Document, Types } from "mongoose";

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "glutes",
  "core",
  "cardio",
  "full_body",
  "other",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "kettlebell",
  "bodyweight",
  "bands",
  "other",
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

export const UNITS = ["kg", "lb", "reps", "seconds", "minutes", "meters"] as const;
export type Unit = (typeof UNITS)[number];

export interface IExercise extends Document {
  userId: Types.ObjectId;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  unit: Unit;
  notes?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    muscleGroup: {
      type: String,
      enum: MUSCLE_GROUPS,
      required: true,
      default: "other",
    },
    equipment: {
      type: String,
      enum: EQUIPMENT,
      required: true,
      default: "bodyweight",
    },
    unit: { type: String, enum: UNITS, required: true, default: "kg" },
    notes: { type: String, trim: true, maxlength: 500 },
    isCustom: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ExerciseSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Exercise: Model<IExercise> =
  (mongoose.models.Exercise as Model<IExercise>) ||
  mongoose.model<IExercise>("Exercise", ExerciseSchema);
