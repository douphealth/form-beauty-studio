/**
 * Content index — merges every content data module into one lookup.
 * The single point the app and the build both read from.
 */
import type { ContentEntry } from "./types";
import { GUIDE_CONTENT } from "./data/guides";
import { GUIDE_CONTENT as COMPRESS_GUIDE } from "./data/guides-compress-for-web";
import { GUIDE_CONTENT as WEBP_AVIF_GUIDE } from "./data/guides-webp-vs-avif";
import { GUIDE_CONTENT as CWV_GUIDE } from "./data/guides-core-web-vitals";
import { GUIDE_CONTENT as RESPONSIVE_GUIDE } from "./data/guides-responsive-images";
import { GUIDE_CONTENT as TOOLS_GUIDE } from "./data/guides-best-tools";
import { GUIDE_CONTENT as REDUCE_GUIDE } from "./data/guides-reduce-file-size";
import { FORMAT_CONTENT as WEBP_FORMAT } from "./data/formats-webp";
import { FORMAT_CONTENT as AVIF_FORMAT } from "./data/formats-avif";
import { FORMAT_CONTENT as JPEG_FORMAT } from "./data/formats-jpeg";
import { FORMAT_CONTENT as PNG_FORMAT } from "./data/formats-png";
import { TOOL_CONTENT as RESIZER_TOOL } from "./data/tools-resizer";
import { TOOL_CONTENT as CONVERTER_TOOL } from "./data/tools-converter";
import { GLOSSARY_CONTENT } from "./data/glossary";
import { COMPANY_CONTENT } from "./data/company";
import { HUB_CONTENT as LEARN_HUB } from "./data/hub-learn";
import { HUB_CONTENT as GLOSSARY_HUB } from "./data/hub-glossary";

export const CONTENT_INDEX: Record<string, ContentEntry> = {
  ...LEARN_HUB,
  ...GLOSSARY_HUB,
  ...GUIDE_CONTENT,
  ...COMPRESS_GUIDE,
  ...WEBP_AVIF_GUIDE,
  ...CWV_GUIDE,
  ...RESPONSIVE_GUIDE,
  ...TOOLS_GUIDE,
  ...REDUCE_GUIDE,
  ...WEBP_FORMAT,
  ...AVIF_FORMAT,
  ...JPEG_FORMAT,
  ...PNG_FORMAT,
  ...RESIZER_TOOL,
  ...CONVERTER_TOOL,
  ...GLOSSARY_CONTENT,
  ...COMPANY_CONTENT,
};

export function getContent(path: string): ContentEntry | undefined {
  return CONTENT_INDEX[path];
}

export const ALL_CONTENT_PATHS = Object.keys(CONTENT_INDEX);
