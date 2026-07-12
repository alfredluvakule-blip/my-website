/**
 * Pump flow and cardiac index calculations.
 *
 * Target pump flow on CPB is conventionally indexed to BSA:
 *   flow (L/min) = cardiac index (L/min/m²) × BSA (m²)
 * Typical adult normothermic CI target: 2.2–2.8; commonly 2.4.
 * Lower indices are accepted with hypothermia.
 */

/** Target pump flow (L/min) for a given cardiac index target and BSA. */
export function targetPumpFlow(bsaM2: number, cardiacIndex = 2.4): number {
  if (bsaM2 <= 0 || !Number.isFinite(bsaM2)) throw new RangeError(`invalid BSA: ${bsaM2}`);
  if (cardiacIndex <= 0 || cardiacIndex > 5) {
    throw new RangeError(`cardiac index out of range: ${cardiacIndex}`);
  }
  return cardiacIndex * bsaM2;
}

/** Achieved cardiac index (L/min/m²) from measured pump flow. */
export function cardiacIndex(flowLMin: number, bsaM2: number): number {
  if (bsaM2 <= 0 || !Number.isFinite(bsaM2)) throw new RangeError(`invalid BSA: ${bsaM2}`);
  if (flowLMin < 0 || !Number.isFinite(flowLMin)) throw new RangeError(`invalid flow: ${flowLMin}`);
  return flowLMin / bsaM2;
}

/**
 * Recommended cardiac index by core temperature — conventional perfusion
 * practice bands. Used for the "low flow" alert threshold, not as a
 * prescription.
 */
export function recommendedCardiacIndexForTemp(tempC: number): number {
  if (tempC >= 35) return 2.4;
  if (tempC >= 32) return 2.2;
  if (tempC >= 28) return 1.8;
  if (tempC >= 22) return 1.6;
  return 1.0; // deep hypothermia
}
