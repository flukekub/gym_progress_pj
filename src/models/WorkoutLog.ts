import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface ISet {
  reps?: number;
  weight?: number;
  durationSec?: number;
  distanceM?: number;
  rpe?: number;
  completed: boolean;
}

export interface IExerciseLog {
  exerciseId: Types.ObjectId;
  exerciseName?: string; // snapshot so logs survive exercise deletion
  order: number;
  sets: ISet[];
  note?: string;
}

export interface IWorkoutLog extends Document {
  userId: Types.ObjectId;
  date: Date;
  title?: string;
  exercises: IExerciseLog[];
  totalVolume?: number;
  durationMin?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SetSchema = new Schema<ISet>(
  {
    reps: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    durationSec: { type: Number, min: 0 },
    distanceM: { type: Number, min: 0 },
    rpe: { type: Number, min: 1, max: 10 },
    completed: { type: Boolean, default: true },
  },
  { _id: false },
);

const ExerciseLogSchema = new Schema<IExerciseLog>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    exerciseName: { type: String, trim: true },
    order: { type: Number, default: 0 },
    sets: { type: [SetSchema], default: [] },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const WorkoutLogSchema = new Schema<IWorkoutLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    title: { type: String, trim: true },
    exercises: { type: [ExerciseLogSchema], default: [] },
    totalVolume: { type: Number, default: 0 },
    durationMin: { type: Number, min: 0 },
  },
  { timestamps: true },
);

WorkoutLogSchema.index({ userId: 1, date: -1 });

export const WorkoutLog: Model<IWorkoutLog> =
  (mongoose.models.WorkoutLog as Model<IWorkoutLog>) ||
  mongoose.model<IWorkoutLog>("WorkoutLog", WorkoutLogSchema);
