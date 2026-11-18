import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { compressPool } from "../lib/compress-pool";
import {
  compressImage,
  createImageFile,
  type CompressionOptions,
} from "../lib/image-utils";

vi.mock("../lib/image-utils", async (importActual) => ({
  ...(await importActual<typeof import("../lib/image-utils")>()),
  compressImage: vi.fn(
    async () => new Blob(["export"], { type: "image/webp" }),
  ),
}));

beforeEach(() => {
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL() {
        return "blob:" + crypto.randomUUID();
      }
      static revokeObjectURL() {}
    },
  );
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

it("finishes every image once and re-encodes completed images when the settings change", async () => {
  const rows = Array.from({ length: 9 }, (_, i) =>
    createImageFile(new File(["input"], i + ".jpg", { type: "image/jpeg" })),
  );
  const options: CompressionOptions = {
    format: "webp",
    quality: 0.8,
    maxDimension: 1600,
  };
  const first = await compressPool(rows, options, () => {});
  expect(first.every((row) => row.status === "done")).toBe(true);
  await compressPool(first, options, () => {});
  expect(compressImage).toHaveBeenCalledTimes(rows.length);
  const changed = await compressPool(
    first,
    { ...options, format: "png" },
    () => {},
  );
  expect(compressImage).toHaveBeenCalledTimes(2 * rows.length);
  expect(changed.map((row) => row.outputFilename)).toEqual(
    rows.map((_, i) => i + ".png"),
  );
});
