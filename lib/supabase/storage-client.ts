import { STORAGE_BUCKETS, STORAGE_LIMITS, STORAGE_PATHS } from "@/lib/constants/storage";
import { compressImage } from "@/lib/utils/image-compression";
import { getSupabaseBrowserClient } from "./browser-client";

type StorageResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const BUCKET = STORAGE_BUCKETS.facilityImages;
const MAX_INPUT_BYTES = STORAGE_LIMITS.inputMaxMB * 1024 * 1024;
const MAX_COMPRESSED_BYTES = STORAGE_LIMITS.compressedMaxMB * 1024 * 1024;
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

const compressAndValidate = async (
  file: File
): Promise<StorageResult<File>> => {
  try {
    const { file: compressedFile } = await compressImage(file);

    if (compressedFile.size > MAX_COMPRESSED_BYTES) {
      return {
        data: null,
        error: {
          message: `Compressed file is still too large: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB (max ${STORAGE_LIMITS.compressedMaxMB} MB). Try a simpler image.`,
        },
      };
    }

    return { data: compressedFile, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "Image compression failed",
      },
    };
  }
};

export const uploadFacilityHeroClient = async (
  facilityId: string,
  file: File,
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const compressionResult = await compressAndValidate(file);
  if (compressionResult.error) {
    return { data: null, error: compressionResult.error };
  }
  const compressedFile = compressionResult.data!;

  const prefix = stripBucket(STORAGE_PATHS.facilityHero(facilityId));
  const path = makePath(prefix, compressedFile.name);
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
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const compressionResult = await compressAndValidate(file);
  if (compressionResult.error) {
    return { data: null, error: compressionResult.error };
  }
  const compressedFile = compressionResult.data!;

  const prefix = stripBucket(STORAGE_PATHS.suggestionImage(tempId));
  const path = makePath(prefix, compressedFile.name);
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
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const compressionResult = await compressAndValidate(file);
  if (compressionResult.error) {
    return { data: null, error: compressionResult.error };
  }
  const compressedFile = compressionResult.data!;

  const prefix = stripBucket(STORAGE_PATHS.bugReportScreenshot(reportId));
  const path = makePath(prefix, compressedFile.name);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressedFile, {
    upsert: true,
  });
  if (error) return { data: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl ? data.publicUrl : null;

  return { data: { path, publicUrl }, error: null };
};

export const uploadRoomImageClient = async (
  facilityId: string,
  roomId: string,
  file: File,
): Promise<StorageResult<{ path: string; publicUrl: string | null }>> => {
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const compressionResult = await compressAndValidate(file);
  if (compressionResult.error) {
    return { data: null, error: compressionResult.error };
  }
  const compressedFile = compressionResult.data!;

  const prefix = stripBucket(STORAGE_PATHS.roomImage(facilityId, roomId));
  const path = makePath(prefix, compressedFile.name);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressedFile, {
    upsert: true,
  });
  if (error) return { data: null, error };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl ? data.publicUrl : null;

  return { data: { path, publicUrl }, error: null };
};

