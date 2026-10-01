export function meanAbsoluteDifference(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length)
    throw new Error(`Images differ in size: ${a.length} vs ${b.length} bytes`);
  if (a.length === 0) return 0;
  let total = 0;
  for (let index = 0; index < a.length; index++) total += Math.abs(a[index] - b[index]);
  return total / a.length;
}
