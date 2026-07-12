/**
 * Intraoperative monitoring records.
 *
 * On each new record we (1) derive DO2i and cardiac index from the reading plus
 * the patient's BSA, (2) evaluate alert rules and persist any that fire. All in
 * one transaction so a record and its alerts land together.
 */
import { computeDo2i, cardiacIndex } from '@perfusio/clinical';
import type { MonitoringRecord as MonitoringInput } from '@perfusio/contracts';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { recordAudit, type AuditContext } from '../../platform/audit.js';
import { evaluateAlerts } from '../alerts/alertRules.js';

async function assertCase(hospitalId: string, caseId: string) {
  const found = await prisma.case.findFirst({ where: { id: caseId, hospitalId, deletedAt: null } });
  if (!found) throw errors.notFound('Case not found');
  return found;
}

export const monitoringService = {
  async list(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.monitoringRecord.findMany({ where: { caseId }, orderBy: { recordedAt: 'asc' } });
  },

  async create(ctx: AuditContext & { hospitalId: string }, caseId: string, input: MonitoringInput) {
    const kase = await assertCase(ctx.hospitalId, caseId);
    const patient = await prisma.patient.findUnique({ where: { id: kase.patientId } });
    const bsaM2 = patient?.bsaM2 ? Number(patient.bsaM2) : undefined;

    // Derive DO2i and cardiac index when inputs are present.
    let do2i: number | undefined;
    let ci: number | undefined;
    if (input.pumpFlowLmin !== undefined && bsaM2) {
      ci = Number(cardiacIndex(input.pumpFlowLmin, bsaM2).toFixed(2));
      if (input.hemoglobin !== undefined && input.sao2 !== undefined) {
        do2i = Number(
          computeDo2i({
            hbGdl: input.hemoglobin,
            sao2Fraction: input.sao2 / 100,
            pao2Mmhg: input.abg?.pao2 ?? 150,
            flowLmin: input.pumpFlowLmin,
            bsaM2,
          }).do2i.toFixed(1),
        );
      }
    }

    const alerts = evaluateAlerts(
      {
        act: input.act,
        pumpFlowLmin: input.pumpFlowLmin,
        reservoirLevelMl: input.reservoirLevelMl,
        arterialLinePressure: input.arterialLinePressure,
        venousLinePressure: input.venousLinePressure,
        nasopharyngealTempC: input.nasopharyngealTempC,
        bladderTempC: input.bladderTempC,
        hematocrit: input.hematocrit,
        lactate: input.abg?.lactate,
        potassium: input.abg?.potassium,
        hemoglobin: input.hemoglobin,
        sao2: input.sao2,
        pao2: input.abg?.pao2,
      },
      { bsaM2 },
    );

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.monitoringRecord.create({
        data: {
          caseId,
          recordedAt: input.recordedAt,
          heartRate: input.heartRate ?? null,
          map: input.map ?? null,
          cvp: input.cvp ?? null,
          nasopharyngealTempC: input.nasopharyngealTempC ?? null,
          bladderTempC: input.bladderTempC ?? null,
          pumpFlowLmin: input.pumpFlowLmin ?? null,
          pumpRpm: input.pumpRpm ?? null,
          arterialLinePressure: input.arterialLinePressure ?? null,
          venousLinePressure: input.venousLinePressure ?? null,
          reservoirLevelMl: input.reservoirLevelMl ?? null,
          sweepGasLmin: input.sweepGasLmin ?? null,
          fio2: input.fio2 ?? null,
          svo2: input.svo2 ?? null,
          sao2: input.sao2 ?? null,
          hematocrit: input.hematocrit ?? null,
          hemoglobin: input.hemoglobin ?? null,
          act: input.act ?? null,
          urineOutputMl: input.urineOutputMl ?? null,
          bloodLossMl: input.bloodLossMl ?? null,
          ph: input.abg?.ph ?? null,
          paco2: input.abg?.paco2 ?? null,
          pao2: input.abg?.pao2 ?? null,
          hco3: input.abg?.hco3 ?? null,
          baseExcess: input.abg?.baseExcess ?? null,
          lactate: input.abg?.lactate ?? null,
          potassium: input.abg?.potassium ?? null,
          sodium: input.abg?.sodium ?? null,
          calcium: input.abg?.calcium ?? null,
          glucose: input.abg?.glucose ?? null,
          do2i: do2i ?? null,
          cardiacIndex: ci ?? null,
          drugsGiven: input.drugsGiven ?? null,
          comments: input.comments ?? null,
        },
      });

      if (alerts.length) {
        await tx.alert.createMany({
          data: alerts.map((a) => ({
            caseId,
            type: a.type,
            severity: a.severity,
            message: a.message,
            value: a.value ?? null,
            threshold: a.threshold ?? null,
          })),
        });
      }
      return created;
    });

    await recordAudit({ ctx, action: 'monitoring.create', entity: 'MonitoringRecord', entityId: record.id });
    return { record, alerts };
  },
};
