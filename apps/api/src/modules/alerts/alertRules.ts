/**
 * Alert evaluation rules.
 *
 * Pure functions: given a monitoring record and case context, return the alerts
 * that should fire. Kept side-effect-free so they are unit-testable and can run
 * identically on the server (persisting alerts) and, later, offline in the PWA.
 * Thresholds follow common adult CPB practice and are overridable per case.
 */
import { DO2I_CRITICAL_THRESHOLD, computeDo2i } from '@perfusio/clinical';
import type { AlertType, AlertSeverity } from '@perfusio/contracts';

export interface AlertThresholds {
  targetAct: number;
  minFlowLmin: number;
  minReservoirMl: number;
  maxArterialPressure: number;
  maxVenousPressure: number;
  minTempC: number;
  maxTempC: number;
  minHematocrit: number;
  maxLactate: number;
  potassiumCriticalHigh: number;
  potassiumCriticalLow: number;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  targetAct: 480,
  minFlowLmin: 2.0,
  minReservoirMl: 300,
  maxArterialPressure: 300,
  maxVenousPressure: 20,
  minTempC: 28,
  maxTempC: 37.5,
  minHematocrit: 22,
  maxLactate: 4,
  potassiumCriticalHigh: 6.0,
  potassiumCriticalLow: 3.0,
};

export interface EvaluatedAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value?: number;
  threshold?: number;
}

export interface MonitoringSnapshot {
  act?: number | null;
  pumpFlowLmin?: number | null;
  reservoirLevelMl?: number | null;
  arterialLinePressure?: number | null;
  venousLinePressure?: number | null;
  nasopharyngealTempC?: number | null;
  bladderTempC?: number | null;
  hematocrit?: number | null;
  lactate?: number | null;
  potassium?: number | null;
  hemoglobin?: number | null;
  sao2?: number | null;
  pao2?: number | null;
}

export interface CaseContextForAlerts {
  bsaM2?: number | null;
}

const n = (v: number | null | undefined): number | undefined =>
  v === null || v === undefined ? undefined : v;

/** Evaluate every rule; returns all alerts that fire for this record. */
export function evaluateAlerts(
  snap: MonitoringSnapshot,
  ctx: CaseContextForAlerts = {},
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS,
): EvaluatedAlert[] {
  const alerts: EvaluatedAlert[] = [];
  const t = thresholds;

  const act = n(snap.act);
  if (act !== undefined && act < t.targetAct) {
    alerts.push({
      type: 'ACT_BELOW_TARGET',
      severity: 'CRITICAL',
      message: `ACT ${act}s is below target ${t.targetAct}s`,
      value: act,
      threshold: t.targetAct,
    });
  }

  const flow = n(snap.pumpFlowLmin);
  if (flow !== undefined && flow < t.minFlowLmin) {
    alerts.push({
      type: 'LOW_FLOW',
      severity: 'CRITICAL',
      message: `Pump flow ${flow} L/min below ${t.minFlowLmin} L/min`,
      value: flow,
      threshold: t.minFlowLmin,
    });
  }

  const reservoir = n(snap.reservoirLevelMl);
  if (reservoir !== undefined && reservoir < t.minReservoirMl) {
    alerts.push({
      type: 'LOW_RESERVOIR',
      severity: 'CRITICAL',
      message: `Reservoir ${reservoir} mL below ${t.minReservoirMl} mL`,
      value: reservoir,
      threshold: t.minReservoirMl,
    });
  }

  const artP = n(snap.arterialLinePressure);
  if (artP !== undefined && artP > t.maxArterialPressure) {
    alerts.push({
      type: 'HIGH_ARTERIAL_PRESSURE',
      severity: 'WARNING',
      message: `Arterial line pressure ${artP} mmHg above ${t.maxArterialPressure} mmHg`,
      value: artP,
      threshold: t.maxArterialPressure,
    });
  }

  const venP = n(snap.venousLinePressure);
  if (venP !== undefined && venP > t.maxVenousPressure) {
    alerts.push({
      type: 'HIGH_VENOUS_PRESSURE',
      severity: 'WARNING',
      message: `Venous line pressure ${venP} mmHg above ${t.maxVenousPressure} mmHg`,
      value: venP,
      threshold: t.maxVenousPressure,
    });
  }

  const temp = n(snap.nasopharyngealTempC) ?? n(snap.bladderTempC);
  if (temp !== undefined && temp < t.minTempC) {
    alerts.push({
      type: 'LOW_TEMPERATURE',
      severity: 'INFO',
      message: `Temperature ${temp}°C below ${t.minTempC}°C`,
      value: temp,
      threshold: t.minTempC,
    });
  }
  if (temp !== undefined && temp > t.maxTempC) {
    alerts.push({
      type: 'HIGH_TEMPERATURE',
      severity: 'WARNING',
      message: `Temperature ${temp}°C above ${t.maxTempC}°C — rewarming risk`,
      value: temp,
      threshold: t.maxTempC,
    });
  }

  const hct = n(snap.hematocrit);
  if (hct !== undefined && hct < t.minHematocrit) {
    alerts.push({
      type: 'LOW_HEMATOCRIT',
      severity: 'WARNING',
      message: `Hematocrit ${hct}% below ${t.minHematocrit}%`,
      value: hct,
      threshold: t.minHematocrit,
    });
  }

  const lactate = n(snap.lactate);
  if (lactate !== undefined && lactate > t.maxLactate) {
    alerts.push({
      type: 'HIGH_LACTATE',
      severity: 'WARNING',
      message: `Lactate ${lactate} mmol/L above ${t.maxLactate} mmol/L`,
      value: lactate,
      threshold: t.maxLactate,
    });
  }

  const k = n(snap.potassium);
  if (k !== undefined && (k > t.potassiumCriticalHigh || k < t.potassiumCriticalLow)) {
    alerts.push({
      type: 'CRITICAL_POTASSIUM',
      severity: 'CRITICAL',
      message: `Potassium ${k} mmol/L outside safe range ${t.potassiumCriticalLow}–${t.potassiumCriticalHigh}`,
      value: k,
    });
  }

  // Indexed oxygen delivery — needs Hb, SaO2, flow, BSA.
  const hb = n(snap.hemoglobin);
  const sao2 = n(snap.sao2);
  const bsa = n(ctx.bsaM2 ?? undefined);
  if (hb !== undefined && sao2 !== undefined && flow !== undefined && bsa !== undefined) {
    const { do2i, belowCritical } = computeDo2i({
      hbGdl: hb,
      sao2Fraction: sao2 / 100,
      pao2Mmhg: n(snap.pao2) ?? 150,
      flowLmin: flow,
      bsaM2: bsa,
    });
    if (belowCritical) {
      alerts.push({
        type: 'LOW_DO2I',
        severity: 'CRITICAL',
        message: `DO2i ${do2i.toFixed(0)} mL/min/m² below critical ${DO2I_CRITICAL_THRESHOLD}`,
        value: Number(do2i.toFixed(0)),
        threshold: DO2I_CRITICAL_THRESHOLD,
      });
    }
  }

  return alerts;
}
