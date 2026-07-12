/**
 * Pump flow and cardiac index calculations.
 *
 * On CPB the roller/centrifugal pump substitutes for the native cardiac output.
 * Target flow is indexed to BSA. Adult full flow is typically 2.4 L/min/m²;
 * paediatric and neonatal cases run higher indices (up to ~3.0) because of
 * higher metabolic rate per unit surface area.
 */

/**
 * Target pump flow (L/min) from cardiac index and BSA.
 * Flow = CI (L/min/m²) × BSA (m²)
 */
export function pumpFlow(cardiacIndexLminM2: number, bsaM2: number): number {
  if (cardiacIndexLminM2 < 0 || cardiacIndexLminM2 > 5) {
    throw new RangeError(`cardiacIndex out of range: ${cardiacIndexLminM2}`);
  }
  if (bsaM2 <= 0 || bsaM2 > 4) {
    throw new RangeError(`bsa out of range: ${bsaM2}`);
  }
  return cardiacIndexLminM2 * bsaM2;
}

/**
 * Cardiac index (L/min/m²) — actual pump flow divided by BSA.
 * The inverse of pumpFlow; used to verify delivered flow against target.
 */
export function cardiacIndex(flowLmin: number, bsaM2: number): number {
  if (flowLmin < 0) throw new RangeError(`flow out of range: ${flowLmin}`);
  if (bsaM2 <= 0 || bsaM2 > 4) throw new RangeError(`bsa out of range: ${bsaM2}`);
  return flowLmin / bsaM2;
}

/**
 * Recommended cardiac index band for a given weight, reflecting the
 * higher metabolic demand of smaller patients. Values are protocol
 * guidance, not hard limits.
 */
export function recommendedCardiacIndex(weightKg: number): { min: number; max: number } {
  if (weightKg < 5) return { min: 2.6, max: 3.0 }; // neonate
  if (weightKg < 15) return { min: 2.5, max: 2.8 }; // infant / small child
  if (weightKg < 30) return { min: 2.4, max: 2.6 }; // child
  return { min: 2.2, max: 2.4 }; // adult
}
