/**
 * Prime volume estimation.
 *
 * The circuit prime is the fluid used to fill the oxygenator, reservoir, and
 * tubing before bypass. Actual prime volume comes from the specific consumables
 * chosen, but a size-based estimate helps planning and the hemodilution
 * prediction before consumables are finalised.
 */

/**
 * Rough total static prime estimate (mL) by patient weight band. Real circuits
 * vary widely; this is planning guidance, overridden by summing the actual
 * component priming volumes once equipment is selected.
 */
export function estimatedPrimeVolume(weightKg: number): number {
  if (weightKg <= 0 || weightKg > 400) throw new RangeError(`weight out of range: ${weightKg}`);
  if (weightKg < 5) return 250; // neonatal circuit
  if (weightKg < 15) return 600; // infant
  if (weightKg < 30) return 1000; // paediatric
  return 1500; // adult
}

/** Sum of individually-known component priming volumes (mL). */
export function summedPrimeVolume(components: {
  oxygenator?: number;
  reservoir?: number;
  arterialTubing?: number;
  venousTubing?: number;
  cardioplegia?: number;
  hemoconcentrator?: number;
  other?: number;
}): number {
  return Object.values(components).reduce<number>((acc, v) => acc + (v ?? 0), 0);
}
