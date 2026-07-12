import { z } from 'zod';
import {
  CannulaType,
  VenousCannulaConfig,
  CardioplegiaType,
  CardioplegiaRoute,
  CardioplegiaTemp,
  TimelineEvent,
} from './enums.js';

/**
 * Intraoperative perfusion data: cannulation, oxygenator/tubing setup,
 * cardioplegia, timeline events, the periodic monitoring record, and
 * anticoagulation. These schemas validate both the API payloads and the
 * React Hook Form inputs.
 */

// ── Cannulation ──────────────────────────────────────────────────────────────
export const cannulaSchema = z.object({
  type: CannulaType,
  venousConfig: VenousCannulaConfig.optional(),
  manufacturer: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  sizeFr: z.number().positive().max(60).optional(),
  lengthCm: z.number().positive().max(120).optional(),
  location: z.string().max(200).optional(),
  lotNumber: z.string().max(120).optional(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});
export type Cannula = z.infer<typeof cannulaSchema>;

// ── Oxygenator ───────────────────────────────────────────────────────────────
export const oxygenatorSchema = z.object({
  manufacturer: z.string().max(200),
  model: z.string().max(200),
  surfaceAreaM2: z.number().positive().max(5).optional(),
  primeVolumeMl: z.number().nonnegative().max(2000).optional(),
  maxFlowLmin: z.number().positive().max(12).optional(),
  hasHeatExchanger: z.boolean().default(true),
  lotNumber: z.string().max(120).optional(),
  expiryDate: z.coerce.date().optional(),
});
export type Oxygenator = z.infer<typeof oxygenatorSchema>;

// ── Cardioplegia dose ────────────────────────────────────────────────────────
export const cardioplegiaDoseSchema = z.object({
  type: CardioplegiaType,
  route: CardioplegiaRoute,
  temperature: CardioplegiaTemp,
  volumeMl: z.number().positive().max(5000),
  pressureMmhg: z.number().nonnegative().max(400).optional(),
  temperatureC: z.number().min(0).max(40).optional(),
  givenAt: z.coerce.date(),
  isRepeat: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});
export type CardioplegiaDose = z.infer<typeof cardioplegiaDoseSchema>;

// ── Anticoagulation ──────────────────────────────────────────────────────────
export const heparinDoseSchema = z.object({
  doseIu: z.number().positive().max(100000),
  givenAt: z.coerce.date(),
  actBefore: z.number().int().nonnegative().max(2000).optional(),
  actAfter: z.number().int().nonnegative().max(2000).optional(),
  targetAct: z.number().int().positive().max(2000).default(480),
});
export type HeparinDose = z.infer<typeof heparinDoseSchema>;

export const protamineDoseSchema = z.object({
  doseMg: z.number().positive().max(2000),
  givenAt: z.coerce.date(),
  actAfter: z.number().int().nonnegative().max(2000).optional(),
  reaction: z.string().max(1000).optional(),
});
export type ProtamineDoseInput = z.infer<typeof protamineDoseSchema>;

// ── Timeline ─────────────────────────────────────────────────────────────────
export const timelineEntrySchema = z.object({
  event: TimelineEvent,
  occurredAt: z.coerce.date(),
  label: z.string().max(200).optional(),
  detail: z.string().max(1000).optional(),
});
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;

// ── Periodic monitoring record (the every-N-minutes row) ─────────────────────
export const abgSchema = z.object({
  ph: z.number().min(6.5).max(8).optional(),
  paco2: z.number().min(0).max(150).optional(),
  pao2: z.number().min(0).max(800).optional(),
  hco3: z.number().min(0).max(60).optional(),
  baseExcess: z.number().min(-30).max(30).optional(),
  lactate: z.number().min(0).max(30).optional(),
  potassium: z.number().min(0).max(12).optional(),
  sodium: z.number().min(80).max(200).optional(),
  calcium: z.number().min(0).max(5).optional(),
  glucose: z.number().min(0).max(60).optional(),
});
export type Abg = z.infer<typeof abgSchema>;

export const monitoringRecordSchema = z.object({
  recordedAt: z.coerce.date(),
  heartRate: z.number().int().min(0).max(300).optional(),
  map: z.number().min(0).max(250).optional(),
  cvp: z.number().min(-10).max(50).optional(),
  nasopharyngealTempC: z.number().min(10).max(42).optional(),
  bladderTempC: z.number().min(10).max(42).optional(),
  pumpFlowLmin: z.number().min(0).max(12).optional(),
  pumpRpm: z.number().int().min(0).max(5000).optional(),
  arterialLinePressure: z.number().min(0).max(600).optional(),
  venousLinePressure: z.number().min(-200).max(100).optional(),
  reservoirLevelMl: z.number().min(0).max(6000).optional(),
  sweepGasLmin: z.number().min(0).max(15).optional(),
  fio2: z.number().min(0.21).max(1).optional(),
  svo2: z.number().min(0).max(100).optional(),
  sao2: z.number().min(0).max(100).optional(),
  hematocrit: z.number().min(0).max(70).optional(),
  hemoglobin: z.number().min(0).max(25).optional(),
  act: z.number().int().min(0).max(2000).optional(),
  urineOutputMl: z.number().min(0).max(5000).optional(),
  bloodLossMl: z.number().min(0).max(10000).optional(),
  abg: abgSchema.optional(),
  drugsGiven: z.string().max(1000).optional(),
  comments: z.string().max(2000).optional(),
});
export type MonitoringRecord = z.infer<typeof monitoringRecordSchema>;

/** Allowed automatic sampling intervals (minutes). */
export const samplingIntervalSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(5),
  z.literal(10),
  z.literal(15),
]);
export type SamplingInterval = z.infer<typeof samplingIntervalSchema>;
