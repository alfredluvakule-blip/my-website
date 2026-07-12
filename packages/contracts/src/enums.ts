import { z } from 'zod';

/**
 * Domain enumerations. Kept in one file so the API, the database mapping, and
 * the UI dropdowns all agree on the exact set of allowed values.
 */

export const UserRole = z.enum([
  'ADMINISTRATOR',
  'PERFUSIONIST',
  'CONSULTANT',
  'CARDIAC_SURGEON',
  'ANESTHESIOLOGIST',
  'NURSE',
  'RESIDENT',
  'STUDENT',
  'RESEARCHER',
  'GUEST',
]);
export type UserRole = z.infer<typeof UserRole>;

export const Sex = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']);
export type Sex = z.infer<typeof Sex>;

export const CaseStatus = z.enum([
  'SCHEDULED',
  'IN_OR',
  'ON_BYPASS',
  'WEANING',
  'COMPLETED',
  'CANCELLED',
]);
export type CaseStatus = z.infer<typeof CaseStatus>;

export const Priority = z.enum(['ELECTIVE', 'URGENT', 'EMERGENCY']);
export type Priority = z.infer<typeof Priority>;

export const BloodGroup = z.enum([
  'A_POS',
  'A_NEG',
  'B_POS',
  'B_NEG',
  'AB_POS',
  'AB_NEG',
  'O_POS',
  'O_NEG',
  'UNKNOWN',
]);
export type BloodGroup = z.infer<typeof BloodGroup>;

export const CannulaType = z.enum(['ARTERIAL', 'VENOUS', 'CARDIOPLEGIA', 'VENT']);
export type CannulaType = z.infer<typeof CannulaType>;

export const VenousCannulaConfig = z.enum([
  'SINGLE',
  'DOUBLE',
  'TWO_STAGE',
  'FEMORAL',
  'SVC',
  'IVC',
]);
export type VenousCannulaConfig = z.infer<typeof VenousCannulaConfig>;

export const CardioplegiaType = z.enum([
  'BLOOD',
  'CRYSTALLOID',
  'DEL_NIDO',
  'ST_THOMAS',
  'CUSTODIOL',
]);
export type CardioplegiaType = z.infer<typeof CardioplegiaType>;

export const CardioplegiaRoute = z.enum(['ANTEGRADE', 'RETROGRADE', 'CORONARY_OSTIAL', 'GRAFT']);
export type CardioplegiaRoute = z.infer<typeof CardioplegiaRoute>;

export const CardioplegiaTemp = z.enum(['COLD', 'WARM', 'TEPID']);
export type CardioplegiaTemp = z.infer<typeof CardioplegiaTemp>;

/** Canonical bypass timeline events; drives the auto-generated timeline. */
export const TimelineEvent = z.enum([
  'PATIENT_IN_OR',
  'ANESTHESIA_START',
  'INCISION',
  'HEPARIN_GIVEN',
  'ACT_MEASURED',
  'CANNULATION',
  'CPB_START',
  'CROSS_CLAMP_ON',
  'CARDIOPLEGIA_GIVEN',
  'CROSS_CLAMP_OFF',
  'WEANING_START',
  'CPB_END',
  'DECANNULATION',
  'PROTAMINE_GIVEN',
  'CASE_COMPLETED',
  'CUSTOM',
]);
export type TimelineEvent = z.infer<typeof TimelineEvent>;

/**
 * Timed intervals recorded in the JKCI ON/OFF/TOTAL table. Each has a start
 * (ON), an end (OFF) and a derived total. CPB and CROSSCLAMP overlap the
 * timeline events; HOT_BLOOD (hot-shot / terminal warm blood cardioplegia) and
 * TCA (total circulatory arrest) are distinct clamp-style intervals.
 */
export const CpbIntervalType = z.enum(['CPB', 'CROSSCLAMP', 'HOT_BLOOD', 'TCA']);
export type CpbIntervalType = z.infer<typeof CpbIntervalType>;

/**
 * Anatomical monitoring sites for the JKCI SITE / SAT / PRESS table — used for
 * pressure and saturation sampling, important in congenital/paediatric work.
 */
export const MonitoringSite = z.enum([
  'SVC',
  'IVC',
  'RA',
  'MAIN_PA',
  'LEFT_PA',
  'RIGHT_PA',
  'LA',
  'LV',
  'AO',
]);
export type MonitoringSite = z.infer<typeof MonitoringSite>;

/** Named ACT checkpoints from the JKCI A.C.T table. */
export const ActCheckpoint = z.enum(['BASELINE', 'POST_HEPARIN', 'ON_PUMP', 'POST_PROTAMINE']);
export type ActCheckpoint = z.infer<typeof ActCheckpoint>;

/** Fluid balance intake categories, matching the JKCI form. */
export const FluidIntakeType = z.enum([
  'PRIME_SOLUTION',
  'BLOOD',
  'SODIUM_CHLORIDE',
  'PLASMALYTE',
  'MANNITOL',
  'OTHER',
]);
export type FluidIntakeType = z.infer<typeof FluidIntakeType>;

/** Fluid balance output categories, matching the JKCI form. */
export const FluidOutputType = z.enum([
  'FAST', // rapid volume removal
  'URINE',
  'ULTRAFILTRATION',
  'HEMOFILTRATION',
  'OTHER',
]);
export type FluidOutputType = z.infer<typeof FluidOutputType>;

export const EquipmentCategory = z.enum([
  'CANNULA',
  'OXYGENATOR',
  'FILTER',
  'RESERVOIR',
  'TUBING_PACK',
  'HEMOCONCENTRATOR',
  'CARDIOPLEGIA_SET',
  'CELL_SAVER',
]);
export type EquipmentCategory = z.infer<typeof EquipmentCategory>;

export const AlertSeverity = z.enum(['INFO', 'WARNING', 'CRITICAL']);
export type AlertSeverity = z.infer<typeof AlertSeverity>;

export const AlertType = z.enum([
  'ACT_BELOW_TARGET',
  'LOW_FLOW',
  'LOW_RESERVOIR',
  'HIGH_ARTERIAL_PRESSURE',
  'HIGH_VENOUS_PRESSURE',
  'LOW_TEMPERATURE',
  'HIGH_TEMPERATURE',
  'LOW_HEMATOCRIT',
  'HIGH_LACTATE',
  'CRITICAL_POTASSIUM',
  'LOW_DO2I',
  'EXPIRED_EQUIPMENT',
]);
export type AlertType = z.infer<typeof AlertType>;

export const ExportFormat = z.enum(['PDF', 'EXCEL', 'CSV', 'FHIR_JSON', 'SPSS', 'STATA', 'R']);
export type ExportFormat = z.infer<typeof ExportFormat>;
