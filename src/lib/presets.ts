import type { OutputFormat } from "./image-utils";

export type PresetId = "web" | "email" | "social" | "print" | "max" | "auto" | "custom";

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  emoji: string;
  format: OutputFormat | "auto"; // "auto" = pick smallest among webp/avif/jpeg
  quality: number;               // 1-100
  maxDimension: number;          // 0 = original
}

export const PRESETS: Preset[] = [
  {
    id: "web",
    label: "Web",
    description: "Fast pages, 1920px",
    emoji: "🌐",
    format: "webp",
    quality: 80,
    maxDimension: 1920,
  },
  {
    id: "email",
    label: "Email",
    description: "Light attachments",
    emoji: "✉️",
    format: "jpeg",
    quality: 72,
    maxDimension: 1280,
  },
  {
    id: "social",
    label: "Social",
    description: "Sharp 2K posts",
    emoji: "📱",
    format: "webp",
    quality: 82,
    maxDimension: 2048,
  },
  {
    id: "print",
    label: "Print",
    description: "High quality",
    emoji: "🖨️",
    format: "jpeg",
    quality: 92,
    maxDimension: 0,
  },
  {
    id: "max",
    label: "Max Quality",
    description: "Lossless PNG",
    emoji: "💎",
    format: "png",
    quality: 100,
    maxDimension: 0,
  },
  {
    id: "auto",
    label: "Auto-Pick",
    description: "Smallest wins",
    emoji: "🪄",
    format: "auto",
    quality: 80,
    maxDimension: 0,
  },
];

export function getPreset(id: PresetId): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
