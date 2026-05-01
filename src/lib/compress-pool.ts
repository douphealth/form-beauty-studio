/**
 * Concurrent compression pool — processes N images in parallel
 * with pause/cancel support, per-image overrides, and auto-pick format.
 */

import type { ImageFile, CompressionOptions, OutputFormat } from './image-utils';
import { compressImage, compressImageAuto, generateOutputFilename } from './image-utils';

const CONCURRENCY = navigator.hardwareConcurrency
  ? Math.min(navigator.hardwareConcurrency, 6)
  : 3;

export interface ProgressUpdate {
  index: number;
  image: ImageFile;
  completed: number;
}

export interface PoolControls {
  signal?: AbortSignal;
  /** Returns true if currently paused (workers will await until false) */
  isPaused?: () => boolean;
  /** Auto-pick: ignore format, encode multiple, keep smallest */
  autoPick?: boolean;
  /** Only process pending/error items (used for retry-failed) */
  onlyRetry?: boolean;
}

async function waitWhilePaused(isPaused?: () => boolean, signal?: AbortSignal) {
  if (!isPaused) return;
  while (isPaused()) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

export async function compressPool(
  images: ImageFile[],
  globalOptions: CompressionOptions,
  onProgress: (update: ProgressUpdate) => void,
  controls: PoolControls = {},
): Promise<ImageFile[]> {
  const { signal, isPaused, autoPick, onlyRetry } = controls;
  const results = [...images];
  let completed = 0;
  let activeIndex = 0;

  const processOne = async (): Promise<void> => {
    while (activeIndex < results.length) {
      if (signal?.aborted) return;
      await waitWhilePaused(isPaused, signal);
      if (signal?.aborted) return;

      const i = activeIndex++;
      const img = results[i];

      // Skip already-done items unless we're forcing reprocess
      if (img.status === 'done') {
        completed++;
        onProgress({ index: i, image: img, completed });
        continue;
      }
      if (onlyRetry && img.status !== 'error' && img.status !== 'cancelled' && img.status !== 'pending') {
        completed++;
        onProgress({ index: i, image: img, completed });
        continue;
      }

      // Revoke previous compressed URL if retrying
      if (img.compressedUrl) {
        URL.revokeObjectURL(img.compressedUrl);
      }

      // Resolve effective options (per-image override beats global)
      const useAuto = img.override?.auto ?? autoPick ?? false;
      const effective: CompressionOptions = {
        format: img.override?.format ?? globalOptions.format,
        quality: img.override?.quality ?? globalOptions.quality,
        maxDimension: img.override?.maxDimension ?? globalOptions.maxDimension,
      };

      results[i] = { ...img, status: 'processing', error: undefined };
      onProgress({ index: i, image: results[i], completed });

      try {
        let blob: Blob;
        let chosenFormat: OutputFormat;
        if (useAuto) {
          const picked = await compressImageAuto(img.file, {
            quality: effective.quality,
            maxDimension: effective.maxDimension,
          });
          blob = picked.blob;
          chosenFormat = picked.format;
        } else {
          blob = await compressImage(img.file, effective);
          chosenFormat = effective.format;
        }

        const outputFilename = generateOutputFilename(img.file.name, chosenFormat);
        const compressedUrl = URL.createObjectURL(blob);

        results[i] = {
          ...results[i],
          status: 'done',
          compressedBlob: blob,
          compressedSize: blob.size,
          compressedUrl,
          outputFilename,
          chosenFormat,
        };
      } catch (err) {
        if (signal?.aborted) {
          results[i] = { ...results[i], status: 'cancelled' };
        } else {
          results[i] = {
            ...results[i],
            status: 'error',
            error: err instanceof Error ? err.message : 'Compression failed',
          };
        }
      }

      completed++;
      onProgress({ index: i, image: results[i], completed });
    }
  };

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, images.length) },
    () => processOne(),
  );

  await Promise.all(workers);
  return results;
}
