import { z } from 'zod';
import { Sex, BloodGroup, CaseStatus, Priority } from './enums.js';

/**
 * Patient registration and case metadata.
 *
 * BSA/BMI are intentionally NOT part of the input schema — they are derived by
 * @perfusio/clinical from weight and height so a stale or mistyped value can
 * never be persisted. The API computes and stores them.
 */

export const patientCreateSchema = z.object({
  hospitalNumber: z.string().min(1, 'Hospital number is required').max(64),
  name: z.string().min(1, 'Patient name is required').max(200),
  /** BMH "REG" — hospital registration number, distinct from the ward MRN. */
  registrationNumber: z.string().max(64).optional(),
  dateOfBirth: z.coerce.date().optional(),
  age: z.number().int().min(0).max(130).optional(),
  sex: Sex,
  weightKg: z.number().positive().max(400),
  heightCm: z.number().positive().max(275),
  bloodGroup: BloodGroup.default('UNKNOWN'),
  allergies: z.array(z.string()).default([]),
  diagnosis: z.string().max(2000).optional(),
  notes: z.string().max(4000).optional(),
});
export type PatientCreate = z.infer<typeof patientCreateSchema>;

export const patientUpdateSchema = patientCreateSchema.partial();
export type PatientUpdate = z.infer<typeof patientUpdateSchema>;

export const caseCreateSchema = z.object({
  patientId: z.string().uuid(),
  /** BMH "PERF NO" — the human-facing perfusion record number. */
  perfNo: z.string().max(64).optional(),
  procedure: z.string().min(1).max(500),
  surgeonId: z.string().uuid().optional(),
  perfusionistId: z.string().uuid().optional(),
  anesthetistId: z.string().uuid().optional(),
  assistantPerfusionistId: z.string().uuid().optional(),
  operatingRoom: z.string().max(64).optional(),
  scheduledDate: z.coerce.date(),
  priority: Priority.default('ELECTIVE'),
  isRedo: z.boolean().default(false),
  status: CaseStatus.default('SCHEDULED'),
  // BMH header timings and blood volume.
  inductionTime: z.coerce.date().optional(),
  cuttingTime: z.coerce.date().optional(),
  heparinTime: z.coerce.date().optional(),
  patientBloodVolumeMl: z.number().int().nonnegative().max(10000).optional(),
  notes: z.string().max(4000).optional(),
});
export type CaseCreate = z.infer<typeof caseCreateSchema>;

export const caseUpdateSchema = caseCreateSchema.partial().omit({ patientId: true });
export type CaseUpdate = z.infer<typeof caseUpdateSchema>;
