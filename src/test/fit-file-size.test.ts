import { expect, it, vi } from "vitest";
import { fitFileSize } from "../lib/fit-file-size";

const sized = (size: number) => new Blob([new Uint8Array(size)]);
it("keeps an export that fits and bounds work for a large export", async () => {
  const encode = vi.fn(async (q: number) => sized(q * 100));
  const small = sized(400);
  expect((await fitFileSize(small, 80, 500, encode)).blob).toBe(small);
  expect(encode).not.toHaveBeenCalled();
  const fit = await fitFileSize(sized(8000), 80, 2600, encode);
  expect(fit.blob.size).toBeLessThanOrEqual(2600);
  expect(fit.quality).toBeGreaterThanOrEqual(21);
  expect(encode.mock.calls.length).toBeLessThanOrEqual(5);
});
it("returns the smaller measured export if neither fits", async () => {
  const original = sized(360);
  const fit = await fitFileSize(original, 40, 10, async () => sized(500));
  expect(fit.blob).toBe(original);
});
