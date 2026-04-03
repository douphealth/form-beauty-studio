/**
 * Concurrent compression pool — processes N images in parallel
 * instead of sequential one-by-one for dramatically faster batch processing.
 */

import type { ImageFile, CompressionOptions } from './image-utils';
import { compressImage, generateOutputFilename } from './image-utils';

const CONCURRENCY = navigator.hardwareConcurrency
  ? Math.min(navigator.hardwareConcurrency, 6)
  : 3;

export interface ProgressUpdate {
  index: number;
  image: ImageFile;
  completed: number;
}

export async function compressPool(
  images: ImageFile[],
  options: CompressionOptions,
  onProgress: (update: ProgressUpdate) => void,
  signal?: AbortSignal,
): Promise<ImageFile[]> {
  const results = [...images];
  let completed = 0;
  let activeIndex = 0;

  const processOne = async (): Promise<void> => {
    while (activeIndex < results.length) {
      if (signal?.aborted) return;

      const i = activeIndex++;
      const img = results[i];

      if (img.status === 'done') {
        completed++;
        onProgress({ index: i, image: img, completed });
        continue;
      }

      // Mark processing
      results[i] = { ...img, status: 'processing' };
      onProgress({ index: i, image: results[i], completed });

      try {
        const blob = await compressImage(img.file, options);
        const outputFilename = generateOutputFilename(img.file.name, options.format);
        const compressedUrl = URL.createObjectURL(blob);

        results[i] = {
          ...results[i],
          status: 'done',
          compressedBlob: blob,
          compressedSize: blob.size,
          compressedUrl,
          outputFilename,
        };
      } catch (err) {
        results[i] = {
          ...results[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Compression failed',
        };
      }

      completed++;
      onProgress({ index: i, image: results[i], completed });
    }
  };

  // Launch N workers
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, images.length) },
    () => processOne()
  );

  await Promise.all(workers);
  return results;
}
