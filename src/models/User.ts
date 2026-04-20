import mongoose, { Schema, Model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  heightCm?: number;
  weightKg?: number;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    heightCm: { type: Number, min: 50, max: 300 },
    weightKg: { type: Number, min: 20, max: 500 },
    birthDate: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
