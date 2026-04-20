import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = registerSchema.parse(json);

    await dbConnect();

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.errors },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
