import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IProgressPhoto extends Document {
  userId: Types.ObjectId;
  storagePath: string; // e.g. "<userId>/2026-04/<uuid>.jpg"
  takenAt: Date;
  weightKg?: number;
  notes?: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressPhotoSchema = new Schema<IProgressPhoto>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storagePath: { type: String, required: true },
    takenAt: { type: Date, required: true, index: true },
    weightKg: { type: Number, min: 20, max: 500 },
    notes: { type: String, trim: true, maxlength: 500 },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true }
);

ProgressPhotoSchema.index({ userId: 1, takenAt: -1 });

export const ProgressPhoto: Model<IProgressPhoto> =
  (mongoose.models.ProgressPhoto as Model<IProgressPhoto>) ||
  mongoose.model<IProgressPhoto>("ProgressPhoto", ProgressPhotoSchema);
