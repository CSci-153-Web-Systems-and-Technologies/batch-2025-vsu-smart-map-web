import { STORAGE_BUCKETS, STORAGE_LIMITS, STORAGE_PATHS } from "@/lib/constants/storage";
import { getSupabaseBrowserClient } from "./browser-client";

type StorageResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const BUCKET = STORAGE_BUCKETS.facilityImages;
const MAX_BYTES = STORAGE_LIMITS.imageMaxMB * 1024 * 1024;
const ACCEPTED = new Set<string>(STORAGE_LIMITS.acceptedTypes);
const BUCKET_REGEX = new RegExp(`^${BUCKET}/?`);

const stripBucket = (path: string) => path.replace(BUCKET_REGEX, "");

const makePath = (prefix: string, filename: string) => {
  const safeName = filename.trim().replace(/\s+/g, "-");
  return `${prefix}/${Date.now()}-${safeName}`;
};

const validateFile = (file: File | Blob) => {
  const type = (file as File).type || "";
  if (!type) {
    return "File type is required and must be valid.";
  }
  if (!ACCEPTED.has(type)) {
    return `Unsupported file type: ${type}`;
  }
  if (file.size > MAX_BYTES) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB (max ${STORAGE_LIMITS.imageMaxMB} MB)`;
  }
  return null;
};

export const uploadFacilityHeroClient = async (
  facilityId: string,
  file: File,
  filename: string,
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const prefix = stripBucket(STORAGE_PATHS.facilityHero(facilityId));
  const path = makePath(prefix, filename);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
  });
  if (error) return { data: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl ? data.publicUrl : null;

  return { data: { path, publicUrl }, error: null };
};
