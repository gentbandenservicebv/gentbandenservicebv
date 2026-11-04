/**
 * Client-side Image Compression Utility
 *
 * Compresses photos directly in the browser (e.g. 4-6 MB iPhone camera photos)
 * down to ~200-400 KB before uploading to UploadThing.
 * Preserves high visual fidelity for tire tread, sidewall markings, and specs.
 */

export interface CompressionOptions {
  /** Maximum width or height in pixels. Default: 1600 */
  maxDimension?: number;
  /** JPEG quality from 0 to 1. Default: 0.82 */
  quality?: number;
  /** Skip compression if file size is below this threshold (in bytes). Default: 600KB */
  thresholdBytes?: number;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

/**
 * Compresses a single File in the browser using HTML5 Canvas.
 * Automatically respects iPhone EXIF orientation and outputs high-quality JPEG.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; stats?: CompressionStats }> {
  const {
    maxDimension = 1600,
    quality = 0.82,
    thresholdBytes = 600 * 1024, // 600 KB
  } = options;

  // Only compress images, ignore non-image files or SVGs/GIFs
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return { file };
  }

  // If already below threshold, keep original to save processing time
  if (file.size <= thresholdBytes) {
    return { file };
  }

  // Safety check for browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { file };
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    // Wait for the image to decode (handles modern EXIF rotation automatically)
    await img.decode();

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    // Calculate proportional downscaled dimensions
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    // Render to canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return { file };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(objectUrl);

    // Export to JPEG blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob || blob.size >= file.size) {
      // If compressed blob is unexpectedly larger than original, return original
      return { file };
    }

    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    const compressedFile = new File([blob], newFileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    const savedPercentage = Math.round(((file.size - compressedFile.size) / file.size) * 100);

    return {
      file: compressedFile,
      stats: {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        savedPercentage,
      },
    };
  } catch (err) {
    console.warn("[Image Compression] Falling back to original file:", err);
    return { file };
  }
}

/**
 * Compresses an array of files concurrently before upload.
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<{ files: File[]; summary?: string }> {
  const results = await Promise.all(files.map((f) => compressImage(f, options)));
  const compressedFiles = results.map((r) => r.file);

  const totalOriginal = results.reduce((acc, r) => acc + (r.stats?.originalSize ?? r.file.size), 0);
  const totalCompressed = results.reduce((acc, r) => acc + r.file.size, 0);

  let summary: string | undefined;
  if (totalOriginal > totalCompressed && totalOriginal > 0) {
    const savedPct = Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100);
    const origMB = (totalOriginal / (1024 * 1024)).toFixed(1);
    const compMB = (totalCompressed / (1024 * 1024)).toFixed(1);
    summary = `${origMB} MB verkleind naar ${compMB} MB (${savedPct}% bespaard)`;
  }

  return { files: compressedFiles, summary };
}
