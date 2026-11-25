/**
 * Never hand back a "compressed" file that is bigger than the one the user gave us,
 * and never undo the metadata stripping that re-encoding provides.
 *
 * Order of preference when the requested output is not smaller than the original:
 *   1. Re-encode in the ORIGINAL format and keep whichever re-encode is smaller.
 *      Re-encoding always drops EXIF/GPS, so this is privacy-safe.
 *   2. If every re-encode is still bigger, keep the original file unchanged, but only
 *      when it embeds no metadata (EXIF, XMP, text chunks) and needed no resizing.
 *   3. Otherwise deliver the smallest re-encode and let the UI say it is larger.
 */
import type { OutputFormat } from "./image-utils";

export type SmallerOutcome =
  | { kind: "encoded"; blob: Blob; format: OutputFormat }
  | { kind: "original" };

const MIME_TO_FORMAT: Record<string, OutputFormat> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function formatOfFile(file: File): OutputFormat | null {
  return MIME_TO_FORMAT[file.type.toLowerCase()] ?? null;
}

/** Signatures of embedded metadata blocks across JPEG, PNG, WebP and AVIF/HEIF. */
const METADATA_MARKERS = [
  "Exif\0\0", // JPEG APP1 EXIF, also inside AVIF/HEIF "Exif" items
  "http://ns.adobe.com/xap/1.0/", // XMP packet (JPEG, PNG iTXt, WebP, AVIF)
  "<x:xmpmeta", // bare XMP
  "eXIf", // PNG EXIF chunk
  "tEXt", // PNG text chunks (author, software, comments)
  "iTXt",
  "zTXt",
  "EXIF", // WebP RIFF EXIF chunk
  "XMP ", // WebP RIFF XMP chunk
  "Photoshop 3.0", // JPEG APP13 IPTC
];

/** Scan the file's bytes for any embedded metadata block. Conservative: any hit counts. */
export function hasEmbeddedMetadata(bytes: Uint8Array): boolean {
  // latin1 maps each byte to one char, so ASCII markers can be searched directly.
  let text = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    text += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return METADATA_MARKERS.some((m) => text.includes(m));
}

async function readBytes(file: Blob): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") return new Uint8Array(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export interface PickSmallerInput {
  original: File;
  output: Blob;
  outputFormat: OutputFormat;
  /** Re-encode the source in another format with the same settings. */
  reencode: (format: OutputFormat) => Promise<Blob>;
  /** True when the source is larger than the max dimension, i.e. resizing was requested. */
  needsResize: () => Promise<boolean>;
}

export async function pickSmaller({
  original,
  output,
  outputFormat,
  reencode,
  needsResize,
}: PickSmallerInput): Promise<SmallerOutcome> {
  if (output.size < original.size) return { kind: "encoded", blob: output, format: outputFormat };

  let best: { blob: Blob; format: OutputFormat } = { blob: output, format: outputFormat };
  const sourceFormat = formatOfFile(original);
  if (sourceFormat && sourceFormat !== outputFormat) {
    try {
      const same = await reencode(sourceFormat);
      if (same.size < best.blob.size) best = { blob: same, format: sourceFormat };
    } catch {
      /* keep the requested output */
    }
  }
  if (best.blob.size < original.size) return { kind: "encoded", ...best };

  const resize = await needsResize().catch(() => true);
  if (!resize) {
    const bytes = await readBytes(original).catch(() => null);
    // Unreadable means unknown, and unknown is treated as "has metadata".
    if (bytes && !hasEmbeddedMetadata(bytes)) return { kind: "original" };
  }
  return { kind: "encoded", ...best };
}
