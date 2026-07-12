/**
 * Hemodilution prediction and prime volume.
 *
 * When the pump is primed with crystalloid, the patient's blood volume is
 * diluted on going onto bypass. Predicting the on-bypass hematocrit lets the
 * perfusionist decide prime composition, RAP (retrograde autologous prime),
 * or whether to add blood to the prime before cannulation — not after the
 * hematocrit has already crashed.
 */

/**
 * Estimated blood volume (mL) by Nadler's formula, sex-specific.
 * Falls back to a weight-based estimate (70 mL/kg) if sex is unknown.
 */
export function estimatedBloodVolume(
  weightKg: number,
  heightCm: number,
  sex: 'male' | 'female' | 'unknown',
): number {
  if (weightKg <= 0) throw new RangeError(`weight out of range: ${weightKg}`);
  const heightM = heightCm / 100;
  if (sex === 'male') {
    return (0.3669 * heightM ** 3 + 0.03219 * weightKg + 0.6041) * 1000;
  }
  if (sex === 'female') {
    return (0.3561 * heightM ** 3 + 0.03308 * weightKg + 0.1833) * 1000;
  }
  // Weight-based fallback (adult ~70 mL/kg).
  return weightKg * 70;
}

/**
 * Predicted hematocrit on bypass after dilution with the prime.
 *
 * HctOnBypass = (EBV × Hct_pre) / (EBV + primeVolume)
 *   where prime is assumed asanguineous (crystalloid). If the prime already
 *   contains packed cells, pass its effective RBC-equivalent volume via
 *   `primeHct` to account for it.
 *
 * @param hctPre  patient hematocrit before bypass, as a percentage (e.g. 40)
 * @param primeHctPercent hematocrit of the prime itself (0 for pure crystalloid)
 */
export function predictedHematocrit(params: {
  bloodVolumeMl: number;
  hctPrePercent: number;
  primeVolumeMl: number;
  primeHctPercent?: number;
}): number {
  const { bloodVolumeMl, hctPrePercent, primeVolumeMl } = params;
  const primeHct = params.primeHctPercent ?? 0;
  if (bloodVolumeMl <= 0) throw new RangeError('bloodVolume must be > 0');
  if (hctPrePercent < 0 || hctPrePercent > 70) {
    throw new RangeError(`hctPre out of range: ${hctPrePercent}`);
  }
  if (primeVolumeMl < 0) throw new RangeError('primeVolume must be >= 0');
  const redCellMass = bloodVolumeMl * hctPrePercent + primeVolumeMl * primeHct;
  return redCellMass / (bloodVolumeMl + primeVolumeMl);
}

/** Hemoglobin (g/dL) predicted from hematocrit, using the ~3:1 rule. */
export function hemoglobinFromHematocrit(hctPercent: number): number {
  if (hctPercent < 0 || hctPercent > 70) throw new RangeError(`hct out of range: ${hctPercent}`);
  return hctPercent / 3;
}

/**
 * Volume of packed red cells (mL) to add to the prime to reach a target
 * on-bypass hematocrit. Returns 0 when dilution already meets target.
 * Assumes PRBC hematocrit of ~60%.
 */
export function primeRbcToTarget(params: {
  bloodVolumeMl: number;
  hctPrePercent: number;
  primeVolumeMl: number;
  targetHctPercent: number;
  prbcHctPercent?: number;
}): number {
  const { bloodVolumeMl, hctPrePercent, primeVolumeMl, targetHctPercent } = params;
  const prbcHct = params.prbcHctPercent ?? 60;
  const predicted = predictedHematocrit({ bloodVolumeMl, hctPrePercent, primeVolumeMl });
  if (predicted >= targetHctPercent) return 0;
  const totalVol = bloodVolumeMl + primeVolumeMl;
  const currentRedCellMass = totalVol * predicted;
  const targetRedCellMass = totalVol * targetHctPercent;
  const deficit = targetRedCellMass - currentRedCellMass;
  return deficit / prbcHct;
}
