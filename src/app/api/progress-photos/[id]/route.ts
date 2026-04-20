import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { getBucketName, getSupabaseAdmin } from "@/lib/supabase";
import { ProgressPhoto } from "@/models/ProgressPhoto";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();
  const photo = await ProgressPhoto.findOneAndDelete({
    _id: params.id,
    userId: session.user.id,
  }).lean();

  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const bucket = getBucketName();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([photo.storagePath]);

  if (error) {
    console.error("[progress-photos] remove failed", error);
    // DB already deleted; return ok but log orphan
  }

  return NextResponse.json({ ok: true });
}
