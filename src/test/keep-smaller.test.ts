import { describe, expect, it, vi } from "vitest";
import { hasEmbeddedMetadata, pickSmaller } from "../lib/keep-smaller";

const bytes = (s: string) => new TextEncoder().encode(s);
const file = (content: string, type: string) => new File([content], "photo." + type.split("/")[1], { type });
const blob = (n: number, type = "image/webp") => new Blob(["x".repeat(n)], { type });

describe("hasEmbeddedMetadata", () => {
  it.each([
    ["JPEG EXIF (GPS lives here)", "\xFF\xD8\xFF\xE1..Exif\0\0MM"],
    ["XMP packet", "<?xpacket?>http://ns.adobe.com/xap/1.0/"],
    ["PNG eXIf chunk", "\x89PNG....eXIf"],
    ["PNG text chunk", "\x89PNG....tEXtSoftware"],
    ["WebP EXIF chunk", "RIFF....WEBPVP8 EXIF"],
    ["IPTC", "Photoshop 3.0\0"],
  ])("detects %s", (_label, content) => {
    expect(hasEmbeddedMetadata(bytes(content))).toBe(true);
  });

  it("treats a bare PNG with only image chunks as clean", () => {
    expect(hasEmbeddedMetadata(bytes("\x89PNG\r\n\x1a\nIHDR....IDAT....IEND"))).toBe(false);
  });
});

describe("pickSmaller", () => {
  const clean = file("\x89PNG IHDR IDAT IEND ".repeat(50), "image/png"); // ~1 KB, no metadata
  const noResize = async () => false;

  it("keeps the requested output whenever it is smaller", async () => {
    const reencode = vi.fn();
    const out = blob(100);
    const r = await pickSmaller({ original: clean, output: out, outputFormat: "webp", reencode, needsResize: noResize });
    expect(r).toEqual({ kind: "encoded", blob: out, format: "webp" });
    expect(reencode).not.toHaveBeenCalled();
  });

  it("switches to the original format when that re-encode is smaller", async () => {
    const png = blob(500, "image/png");
    const reencode = vi.fn(async () => png);
    const r = await pickSmaller({ original: clean, output: blob(5000), outputFormat: "webp", reencode, needsResize: noResize });
    expect(reencode).toHaveBeenCalledWith("png");
    expect(r).toEqual({ kind: "encoded", blob: png, format: "png" });
  });

  it("keeps a clean original when every re-encode is bigger", async () => {
    const r = await pickSmaller({
      original: clean, output: blob(5000), outputFormat: "webp",
      reencode: async () => blob(4000, "image/png"), needsResize: noResize,
    });
    expect(r).toEqual({ kind: "original" });
  });

  it("never returns an original that carries metadata such as GPS", async () => {
    const withExif = file("\xFF\xD8\xFF\xE1Exif\0\0GPS" + "y".repeat(800), "image/jpeg");
    const smallestReencode = blob(2000, "image/jpeg");
    const r = await pickSmaller({
      original: withExif, output: blob(3000), outputFormat: "webp",
      reencode: async () => smallestReencode, needsResize: noResize,
    });
    expect(r).toEqual({ kind: "encoded", blob: smallestReencode, format: "jpeg" });
  });

  it("does not return the original when the user asked for a resize it needs", async () => {
    const out = blob(5000);
    const r = await pickSmaller({
      original: clean, output: out, outputFormat: "webp",
      reencode: async () => blob(6000, "image/png"), needsResize: async () => true,
    });
    expect(r).toEqual({ kind: "encoded", blob: out, format: "webp" });
  });

  it("assumes a resize is needed when dimensions cannot be read", async () => {
    const r = await pickSmaller({
      original: clean, output: blob(5000), outputFormat: "webp",
      reencode: async () => blob(6000, "image/png"), needsResize: async () => { throw new Error("no decoder"); },
    });
    expect(r.kind).toBe("encoded");
  });
});
