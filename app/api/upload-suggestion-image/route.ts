export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { STORAGE_BUCKETS, STORAGE_LIMITS, STORAGE_PATHS } from "@/lib/constants/storage";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server-client";

const BUCKET = STORAGE_BUCKETS.facilityImages;
const MAX_INPUT_BYTES = STORAGE_LIMITS.inputMaxMB * 1024 * 1024;
const ACCEPTED = new Set<string>(STORAGE_LIMITS.acceptedTypes);

const stripBucket = (path: string) => path.replace(new RegExp(`^${BUCKET}/?`), "");

const makePath = (prefix: string, filename: string) => {
  const safeName = filename.trim().replace(/[^a-zA-Z0-9.-]/g, "-");
  return `${prefix}/${Date.now()}-${safeName}`;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const tempId = formData.get("tempId");

  if (!(file instanceof File) || typeof tempId !== "string") {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  if (!file.type || !ACCEPTED.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type || "unknown"}` }, { status: 400 });
  }

  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json({
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB (max ${STORAGE_LIMITS.inputMaxMB} MB)`,
    }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServiceRoleClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Service role unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const prefix = stripBucket(STORAGE_PATHS.suggestionImage(tempId));
  const path = makePath(prefix, file.name);

  const { error } = await supabase.storage.from(BUCKET).upload(
    path,
    Buffer.from(await file.arrayBuffer()),
    { upsert: false, contentType: file.type },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ path, publicUrl: data?.publicUrl ?? null });
}
