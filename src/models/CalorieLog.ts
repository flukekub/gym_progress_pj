import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface ICalorieLog extends Document {
  userId: Types.ObjectId;
  date: Date;
  caloriesBurned: number;
  createdAt: Date;
  updatedAt: Date;
}

const CalorieLogSchema = new Schema<ICalorieLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    caloriesBurned: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Ensure only one calorie log per user per day
CalorieLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const CalorieLog: Model<ICalorieLog> =
  (mongoose.models.CalorieLog as Model<ICalorieLog>) ||
  mongoose.model<ICalorieLog>("CalorieLog", CalorieLogSchema);
