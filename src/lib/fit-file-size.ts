// Search only measured encodes. A smaller quality setting need not produce a smaller file.
export async function fitFileSize(
  first: Blob,
  ceiling: number,
  targetBytes: number,
  encode: (quality: number) => Promise<Blob>,
): Promise<{ blob: Blob; quality: number }> {
  let best = { blob: first, quality: ceiling };
  if (first.size <= targetBytes || ceiling <= 1) return best;

  const minimum = await encode(1);
  if (minimum.size < best.blob.size) best = { blob: minimum, quality: 1 };
  if (minimum.size > targetBytes) return best;

  let low = 2;
  let high = ceiling - 1;
  for (let attempt = 0; attempt < 4 && low <= high; attempt++) {
    const quality = Math.floor((low + high) / 2);
    const blob = await encode(quality);
    if (blob.size <= targetBytes) {
      best = { blob, quality };
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }
  return best;
}
