/**
 * Anticoagulation — heparin and protamine dosing.
 *
 * Heparin is dosed by weight to achieve full anticoagulation before cannulation;
 * ACT confirms it. Protamine reverses heparin at the end of bypass. These are
 * decision-support estimates — institutional protocol and the ACT always govern
 * the actual dose given.
 */

/** Default heparin loading dose: 300–400 IU/kg. */
export const DEFAULT_HEPARIN_IU_PER_KG = 300;

/** Default target ACT for safe initiation of CPB (seconds). */
export const DEFAULT_TARGET_ACT = 480;

/**
 * Heparin loading dose (IU).
 * dose = weight(kg) × IU/kg
 */
export function heparinLoadingDose(weightKg: number, iuPerKg = DEFAULT_HEPARIN_IU_PER_KG): number {
  if (weightKg <= 0 || weightKg > 400) throw new RangeError(`weight out of range: ${weightKg}`);
  if (iuPerKg < 100 || iuPerKg > 600) throw new RangeError(`iuPerKg out of range: ${iuPerKg}`);
  return weightKg * iuPerKg;
}

/**
 * Protamine reversal dose (mg).
 * Common ratio: 1 mg protamine per 100 IU of circulating heparin.
 * @param heparinIu total heparin considered circulating at reversal
 * @param ratioMgPer100Iu mg protamine per 100 IU heparin (default 1.0)
 */
export function protamineDose(heparinIu: number, ratioMgPer100Iu = 1.0): number {
  if (heparinIu < 0) throw new RangeError(`heparinIu out of range: ${heparinIu}`);
  if (ratioMgPer100Iu <= 0 || ratioMgPer100Iu > 2) {
    throw new RangeError(`ratio out of range: ${ratioMgPer100Iu}`);
  }
  return (heparinIu / 100) * ratioMgPer100Iu;
}

/**
 * Is the ACT adequate to initiate or continue bypass?
 * Returns a structured verdict for alerting.
 */
export function evaluateAct(
  actSeconds: number,
  targetAct = DEFAULT_TARGET_ACT,
): { adequate: boolean; deficit: number } {
  if (actSeconds < 0) throw new RangeError(`ACT out of range: ${actSeconds}`);
  return {
    adequate: actSeconds >= targetAct,
    deficit: Math.max(0, targetAct - actSeconds),
  };
}

/**
 * Additional heparin (IU) suggested when ACT is below target, using a
 * simple heparin dose–response estimate. This is a rough top-up guide only.
 * @param heparinSensitivity IU/kg needed to raise ACT by 1 s (institutional)
 */
export function heparinTopUp(params: {
  weightKg: number;
  currentAct: number;
  targetAct?: number;
  actRisePer1000Iu?: number;
}): number {
  const { weightKg, currentAct } = params;
  const targetAct = params.targetAct ?? DEFAULT_TARGET_ACT;
  // Empirical: ~1000 IU raises ACT by this many seconds in a 70 kg adult.
  const risePer1000 = params.actRisePer1000Iu ?? 30;
  const { deficit } = evaluateAct(currentAct, targetAct);
  if (deficit === 0) return 0;
  const per1000Adjusted = risePer1000 * (70 / weightKg);
  return (deficit / per1000Adjusted) * 1000;
}
