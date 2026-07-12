/**
 * Oxygen delivery on CPB.
 *
 * DO2 is the single most important perfusion safety parameter after flow.
 * The GIFT-style "goal-directed perfusion" literature links indexed oxygen
 * delivery (DO2i) below ~270 mL/min/m² to acute kidney injury, so this is a
 * primary alerting target.
 */

/**
 * Arterial oxygen content CaO2 (mL O2 / dL blood).
 * CaO2 = (1.34 × Hb × SaO2) + (0.003 × PaO2)
 *   Hb in g/dL, SaO2 as a fraction (0–1), PaO2 in mmHg.
 * 1.34 = Hüfner's constant (mL O2 per g Hb).
 */
export function arterialOxygenContent(hbGdl: number, sao2Fraction: number, pao2Mmhg: number): number {
  if (hbGdl < 0 || hbGdl > 25) throw new RangeError(`Hb out of range: ${hbGdl}`);
  if (sao2Fraction < 0 || sao2Fraction > 1) {
    throw new RangeError(`SaO2 must be a fraction 0–1: ${sao2Fraction}`);
  }
  if (pao2Mmhg < 0 || pao2Mmhg > 800) throw new RangeError(`PaO2 out of range: ${pao2Mmhg}`);
  return 1.34 * hbGdl * sao2Fraction + 0.003 * pao2Mmhg;
}

/**
 * Oxygen delivery DO2 (mL O2 / min).
 * DO2 = CaO2 (mL/dL) × flow (L/min) × 10
 *   ×10 converts dL→L (10 dL per L).
 */
export function oxygenDelivery(caO2MlDl: number, flowLmin: number): number {
  if (flowLmin < 0) throw new RangeError(`flow out of range: ${flowLmin}`);
  return caO2MlDl * flowLmin * 10;
}

/**
 * Indexed oxygen delivery DO2i (mL O2 / min / m²).
 * The perfusion safety target; critical threshold commonly ~270.
 */
export function indexedOxygenDelivery(do2MlMin: number, bsaM2: number): number {
  if (bsaM2 <= 0 || bsaM2 > 4) throw new RangeError(`bsa out of range: ${bsaM2}`);
  return do2MlMin / bsaM2;
}

/** Critical DO2i threshold (mL/min/m²) below which AKI risk rises. */
export const DO2I_CRITICAL_THRESHOLD = 270;

/**
 * One-shot convenience: compute DO2i from primary inputs.
 */
export function computeDo2i(params: {
  hbGdl: number;
  sao2Fraction: number;
  pao2Mmhg: number;
  flowLmin: number;
  bsaM2: number;
}): { caO2: number; do2: number; do2i: number; belowCritical: boolean } {
  const caO2 = arterialOxygenContent(params.hbGdl, params.sao2Fraction, params.pao2Mmhg);
  const do2 = oxygenDelivery(caO2, params.flowLmin);
  const do2i = indexedOxygenDelivery(do2, params.bsaM2);
  return { caO2, do2, do2i, belowCritical: do2i < DO2I_CRITICAL_THRESHOLD };
}
