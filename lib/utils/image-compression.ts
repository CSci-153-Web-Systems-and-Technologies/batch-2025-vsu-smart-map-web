import imageCompression from "browser-image-compression";
import { STORAGE_LIMITS } from "@/lib/constants/storage";

export type CompressionResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
  format: string;
};

export async function compressImage(file: File): Promise<CompressionResult> {
  const { compression, compressedMaxMB } = STORAGE_LIMITS;

  const options = {
    maxSizeMB: compressedMaxMB,
    maxWidthOrHeight: compression.maxWidthOrHeight,
    useWebWorker: compression.useWebWorker,
    fileType: compression.fileType,
    initialQuality: compression.quality,
  };

  const compressedBlob = await imageCompression(file, options);

  const webpName = file.name.replace(/\.[^.]+$/, ".webp");
  const compressedFile = new File([compressedBlob], webpName, {
    type: "image/webp",
  });

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    format: "webp",
  };
}
