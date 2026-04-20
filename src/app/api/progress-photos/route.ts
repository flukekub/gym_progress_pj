import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { getBucketName, getSupabaseAdmin } from "@/lib/supabase";
import { ProgressPhoto } from "@/models/ProgressPhoto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/avif",
]);
const SIGNED_URL_TTL = 60 * 60; // 1 hour

/**
 * POST /api/progress-photos
 *
 * Accepts multipart/form-data:
 *  - file:       File (required)
 *  - takenAt:    ISO date string (optional, defaults to now)
 *  - weightKg:   number (optional)
 *  - notes:      string (optional)
 *
 * Uploads the file to Supabase Storage using the service-role key,
 * then saves a ProgressPhoto doc in MongoDB pointing at the storage path.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${file.type}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 413 }
    );
  }

  const takenAtRaw = form.get("takenAt");
  const takenAt = takenAtRaw ? new Date(String(takenAtRaw)) : new Date();
  if (Number.isNaN(takenAt.getTime())) {
    return NextResponse.json({ error: "Invalid takenAt" }, { status: 400 });
  }

  const weightRaw = form.get("weightKg");
  const weightKg = weightRaw ? Number(weightRaw) : undefined;
  const notes = form.get("notes") ? String(form.get("notes")) : undefined;

  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    file.type.split("/")[1] ||
    "jpg";
  const yyyymm = `${takenAt.getUTCFullYear()}-${String(
    takenAt.getUTCMonth() + 1
  ).padStart(2, "0")}`;
  const storagePath = `${session.user.id}/${yyyymm}/${randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const bucket = getBucketName();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadErr) {
    console.error("[progress-photos] upload failed", uploadErr);
    return NextResponse.json(
      { error: "Failed to upload file", details: uploadErr.message },
      { status: 500 }
    );
  }

  try {
    await dbConnect();
    const photo = await ProgressPhoto.create({
      userId: session.user.id,
      storagePath,
      takenAt,
      weightKg,
      notes,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    const { data: signed } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_TTL);

    return NextResponse.json(
      {
        photo: {
          _id: photo.id,
          storagePath: photo.storagePath,
          takenAt: photo.takenAt,
          weightKg: photo.weightKg,
          notes: photo.notes,
          mimeType: photo.mimeType,
          sizeBytes: photo.sizeBytes,
          url: signed?.signedUrl ?? null,
          createdAt: photo.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // Rollback storage upload on DB failure
    await supabase.storage.from(bucket).remove([storagePath]);
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/progress-photos
 * Returns the user's photos newest-first, each with a fresh signed URL.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const photos = await ProgressPhoto.find({ userId: session.user.id })
    .sort({ takenAt: -1 })
    .lean();

  if (photos.length === 0) return NextResponse.json({ photos: [] });

  const supabase = getSupabaseAdmin();
  const bucket = getBucketName();
  const paths = photos.map((p) => p.storagePath);
  const { data: signed, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  if (error) {
    console.error("[progress-photos] createSignedUrls", error);
  }

  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  return NextResponse.json({
    photos: photos.map((p) => ({
      _id: String(p._id),
      storagePath: p.storagePath,
      takenAt: p.takenAt,
      weightKg: p.weightKg,
      notes: p.notes,
      mimeType: p.mimeType,
      sizeBytes: p.sizeBytes,
      url: urlByPath.get(p.storagePath) ?? null,
      createdAt: p.createdAt,
    })),
  });
}
