/**
 * WASM Codec Engine — powered by jSquash (Squoosh codecs)
 * 
 * Uses MozJPEG, libwebp, OxiPNG, and AVIF WASM encoders
 * for dramatically better compression than the Canvas API.
 */

import type { OutputFormat } from './image-utils';

// ── Lazy-loaded codec modules ──────────────────────────────────

async function encodeJpeg(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  const { encode } = await import('@jsquash/jpeg');
  return encode(imageData, { quality });
}

async function decodeJpeg(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import('@jsquash/jpeg');
  return decode(buffer);
}

async function encodeWebp(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  const { encode } = await import('@jsquash/webp');
  return encode(imageData, { quality });
}

async function decodeWebp(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import('@jsquash/webp');
  return decode(buffer);
}

async function encodePng(imageData: ImageData): Promise<ArrayBuffer> {
  // Encode to PNG first, then optimize with OxiPNG
  const { encode } = await import('@jsquash/png');
  const pngBuffer = await encode(imageData);
  
  try {
    const { optimise } = await import('@jsquash/oxipng');
    return optimise(pngBuffer as any, { level: 2 });
  } catch {
    // Fall back to unoptimized PNG if oxipng fails
    return pngBuffer;
  }
}

async function decodePng(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import('@jsquash/png');
  return decode(buffer);
}

async function encodeAvif(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  const { encode } = await import('@jsquash/avif');
  return encode(imageData, {
    quality,
    qualityAlpha: -1,
    speed: 6,
    subsample: 1,
    chromaDeltaQ: false,
    sharpness: 0,
    tune: 0,
    denoiseLevel: 0,
  });
}

async function decodeAvif(buffer: ArrayBuffer): Promise<ImageData> {
  const { decode } = await import('@jsquash/avif');
  return decode(buffer);
}

// ── Universal decoder ──────────────────────────────────────────

/**
 * Decode any supported image file to ImageData.
 * Uses WASM decoders for known formats, falls back to createImageBitmap.
 */
export async function decodeImage(file: File): Promise<ImageData> {
  const buffer = await file.arrayBuffer();
  const type = file.type;

  try {
    if (type === 'image/jpeg') return await decodeJpeg(buffer);
    if (type === 'image/webp') return await decodeWebp(buffer);
    if (type === 'image/png') return await decodePng(buffer);
    if (type === 'image/avif') return await decodeAvif(buffer);
  } catch {
    // Fall through to bitmap fallback
  }

  // Fallback: use browser's built-in decoder via createImageBitmap
  return await fallbackDecode(file);
}

async function fallbackDecode(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// ── Resize using OffscreenCanvas ───────────────────────────────

export function resizeImageData(
  imageData: ImageData,
  maxDimension: number
): ImageData {
  let { width, height } = imageData;

  if (width <= maxDimension && height <= maxDimension) {
    return imageData;
  }

  const scale = Math.min(maxDimension / width, maxDimension / height);
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  // Use OffscreenCanvas for high-quality resize
  const srcCanvas = new OffscreenCanvas(width, height);
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.putImageData(imageData, 0, 0);

  const dstCanvas = new OffscreenCanvas(newW, newH);
  const dstCtx = dstCanvas.getContext('2d')!;
  dstCtx.drawImage(srcCanvas, 0, 0, newW, newH);

  return dstCtx.getImageData(0, 0, newW, newH);
}

// ── Encode to target format ────────────────────────────────────

export async function encodeImage(
  imageData: ImageData,
  format: OutputFormat,
  quality: number // 0-100
): Promise<Blob> {
  let encoded: ArrayBuffer;

  switch (format) {
    case 'jpeg':
      encoded = await encodeJpeg(imageData, quality);
      break;
    case 'webp':
      encoded = await encodeWebp(imageData, quality);
      break;
    case 'png':
      encoded = await encodePng(imageData);
      break;
    case 'avif':
      encoded = await encodeAvif(imageData, quality);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const MIME_MAP: Record<OutputFormat, string> = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
  };

  return new Blob([encoded], { type: MIME_MAP[format] });
}

// ── Check WASM support ─────────────────────────────────────────

let _wasmSupported: boolean | null = null;

export async function isWasmSupported(): Promise<boolean> {
  if (_wasmSupported !== null) return _wasmSupported;
  try {
    _wasmSupported = typeof WebAssembly === 'object'
      && typeof WebAssembly.instantiate === 'function';
  } catch {
    _wasmSupported = false;
  }
  return _wasmSupported;
}
