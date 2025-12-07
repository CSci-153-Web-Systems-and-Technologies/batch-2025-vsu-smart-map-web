import { STORAGE_BUCKETS, STORAGE_LIMITS, STORAGE_PATHS } from "@/lib/constants/storage";
import { compressImage } from "@/lib/utils/image-compression";
import { getSupabaseBrowserClient } from "./browser-client";

type StorageResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const BUCKET = STORAGE_BUCKETS.facilityImages;
const MAX_INPUT_BYTES = STORAGE_LIMITS.inputMaxMB * 1024 * 1024;
const ACCEPTED = new Set<string>(STORAGE_LIMITS.acceptedTypes);
const BUCKET_REGEX = new RegExp(`^${BUCKET}/?`);

const stripBucket = (path: string) => path.replace(BUCKET_REGEX, "");

const makePath = (prefix: string, filename: string) => {
  const safeName = filename.trim().replace(/[^a-zA-Z0-9.-]/g, "-");
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
  if (file.size > MAX_INPUT_BYTES) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB (max ${STORAGE_LIMITS.inputMaxMB} MB)`;
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

  const { file: compressedFile } = await compressImage(file);
  const webpName = filename.replace(/\.[^.]+$/, ".webp");

  const prefix = stripBucket(STORAGE_PATHS.facilityHero(facilityId));
  const path = makePath(prefix, webpName);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressedFile, {
    upsert: true,
  });
  if (error) return { data: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl ? data.publicUrl : null;

  return { data: { path, publicUrl }, error: null };
};

export const uploadSuggestionImageClient = async (
  tempId: string,
  file: File,
  filename: string,
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const { file: compressedFile } = await compressImage(file);
  const webpName = filename.replace(/\.[^.]+$/, ".webp");

  const prefix = stripBucket(STORAGE_PATHS.suggestionImage(tempId));
  const path = makePath(prefix, webpName);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressedFile, {
    upsert: true,
  });
  if (error) return { data: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl ? data.publicUrl : null;

  return { data: { path, publicUrl }, error: null };
};

export const uploadBugScreenshotClient = async (
  reportId: string,
  file: File,
  filename: string,
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const { file: compressedFile } = await compressImage(file);
  const webpName = filename.replace(/\.[^.]+$/, ".webp");

  const prefix = stripBucket(STORAGE_PATHS.bugReportScreenshot(reportId));
  const path = makePath(prefix, webpName);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressedFile, {
    upsert: true,
  });
  if (error) return { data: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl ? data.publicUrl : null;

  return { data: { path, publicUrl }, error: null };
};
