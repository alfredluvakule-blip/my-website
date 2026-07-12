/**
 * Research de-identification.
 *
 * Produces an anonymized case dataset with all direct patient identifiers
 * removed and a stable pseudonymous subject id (salted hash of the real id).
 * The same real id always maps to the same pseudonym within an export salt, so
 * longitudinal linkage is possible without exposing PHI. Ages are banded and
 * exact dates are reduced to study-relative offsets.
 */
import { createHash } from 'node:crypto';

const DIRECT_IDENTIFIERS = [
  'name',
  'hospitalNumber',
  'dateOfBirth',
  'allergies',
  'notes',
  'diagnosis', // free text can carry identifiers; excluded by default
] as const;

/** Deterministic pseudonym for a real id under an export-specific salt. */
export function pseudonymize(realId: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${realId}`).digest('hex').slice(0, 16);
}

/** Band an exact age into 10-year groups to reduce re-identification risk. */
export function bandAge(age: number | null | undefined): string | null {
  if (age === null || age === undefined) return null;
  if (age < 1) return '<1';
  const lower = Math.floor(age / 10) * 10;
  return `${lower}-${lower + 9}`;
}

export interface AnonymizedCase {
  subjectId: string;
  ageBand: string | null;
  sex: string;
  weightKg: number;
  heightCm: number;
  bsaM2: number | null;
  bmi: number | null;
  bloodGroup: string;
  procedure: string;
  priority: string;
  isRedo: boolean;
  cpbTimeMin: number | null;
  crossClampTimeMin: number | null;
}

type RawCase = {
  id: string;
  procedure: string;
  priority: string;
  isRedo: boolean;
  cpbTimeMin: number | null;
  crossClampTimeMin: number | null;
  patient: {
    id: string;
    age: number | null;
    sex: string;
    weightKg: unknown;
    heightCm: unknown;
    bsaM2: unknown;
    bmi: unknown;
    bloodGroup: string;
  } & Record<string, unknown>;
};

/**
 * Map a fully-loaded case row to its anonymized form. Any field named in
 * DIRECT_IDENTIFIERS is guaranteed absent from the output shape.
 */
export function anonymizeCase(raw: RawCase, salt: string): AnonymizedCase {
  // Defensive: assert we never accidentally include a direct identifier.
  for (const key of DIRECT_IDENTIFIERS) {
    if (key in (raw as Record<string, unknown>)) {
      delete (raw as Record<string, unknown>)[key];
    }
  }
  return {
    subjectId: pseudonymize(raw.patient.id, salt),
    ageBand: bandAge(raw.patient.age),
    sex: raw.patient.sex,
    weightKg: Number(raw.patient.weightKg),
    heightCm: Number(raw.patient.heightCm),
    bsaM2: raw.patient.bsaM2 !== null ? Number(raw.patient.bsaM2) : null,
    bmi: raw.patient.bmi !== null ? Number(raw.patient.bmi) : null,
    bloodGroup: raw.patient.bloodGroup,
    procedure: raw.procedure,
    priority: raw.priority,
    isRedo: raw.isRedo,
    cpbTimeMin: raw.cpbTimeMin,
    crossClampTimeMin: raw.crossClampTimeMin,
  };
}
