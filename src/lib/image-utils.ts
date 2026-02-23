export type OutputFormat = 'jpeg' | 'png' | 'webp';

export interface CompressionOptions {
  format: OutputFormat;
  quality: number; // 0.01 - 1
  maxDimension: number | null;
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedBlob: Blob | null;
  compressedSize: number | null;
  compressedUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
  outputFilename: string;
}

const MIME_MAP: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const EXT_MAP: Record<OutputFormat, string> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
};

export function getExtension(format: OutputFormat): string {
  return EXT_MAP[format];
}

export function getMimeType(format: OutputFormat): string {
  return MIME_MAP[format];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

function getBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

export function generateOutputFilename(originalName: string, format: OutputFormat, customName?: string): string {
  const base = customName || getBaseName(originalName);
  return base + getExtension(format);
}

export function compressImage(file: File, options: CompressionOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // Resize if needed
        if (options.maxDimension && (width > options.maxDimension || height > options.maxDimension)) {
          const ratio = Math.min(options.maxDimension / width, options.maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // White background for JPEG (no transparency)
        if (options.format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mime = getMimeType(options.format);
        // PNG doesn't use quality parameter
        const quality = options.format === 'png' ? undefined : options.quality;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mime,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function createImageFile(file: File): ImageFile {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    originalSize: file.size,
    compressedBlob: null,
    compressedSize: null,
    compressedUrl: null,
    status: 'pending',
    outputFilename: file.name,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name);
}
