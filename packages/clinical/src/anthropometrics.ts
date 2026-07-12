/**
 * Anthropometric calculations — BSA and BMI.
 *
 * BSA drives nearly every downstream perfusion number (target flow, DO2i,
 * cardiac index), so both formulas commonly used in perfusion practice are
 * provided. Du Bois is the default because most perfusion literature and
 * institutional protocols reference it.
 */

/** Guard: weight in kg must be physiologic (300g neonate → 400 kg). */
function assertWeight(weightKg: number): void {
  if (!Number.isFinite(weightKg) || weightKg < 0.3 || weightKg > 400) {
    throw new RangeError(`weightKg out of physiologic range: ${weightKg}`);
  }
}

/** Guard: height in cm must be physiologic. */
function assertHeight(heightCm: number): void {
  if (!Number.isFinite(heightCm) || heightCm < 20 || heightCm > 275) {
    throw new RangeError(`heightCm out of physiologic range: ${heightCm}`);
  }
}

/**
 * Body Surface Area — Du Bois & Du Bois (1916).
 * BSA (m²) = 0.007184 × weight(kg)^0.425 × height(cm)^0.725
 */
export function bsaDuBois(weightKg: number, heightCm: number): number {
  assertWeight(weightKg);
  assertHeight(heightCm);
  return 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
}

/**
 * Body Surface Area — Mosteller (1987).
 * BSA (m²) = sqrt( height(cm) × weight(kg) / 3600 )
 */
export function bsaMosteller(weightKg: number, heightCm: number): number {
  assertWeight(weightKg);
  assertHeight(heightCm);
  return Math.sqrt((heightCm * weightKg) / 3600);
}

/**
 * Body Mass Index.
 * BMI (kg/m²) = weight(kg) / height(m)²
 */
export function bmi(weightKg: number, heightCm: number): number {
  assertWeight(weightKg);
  assertHeight(heightCm);
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export type BsaFormula = 'dubois' | 'mosteller';

/** BSA with selectable formula; defaults to Du Bois. */
export function bsa(weightKg: number, heightCm: number, formula: BsaFormula = 'dubois'): number {
  return formula === 'mosteller' ? bsaMosteller(weightKg, heightCm) : bsaDuBois(weightKg, heightCm);
}
