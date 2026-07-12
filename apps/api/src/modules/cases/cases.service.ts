/**
 * Case service — the surgical case and its derived run summary.
 *
 * CPB time and cross-clamp time are recomputed from timeline events whenever
 * the timeline changes, using @perfusio/clinical, so the summary on the record
 * can never disagree with the events the user logged.
 */
import {
  totalBypassMinutes,
  totalCrossClampMinutes,
  pumpFlow,
  recommendedCardiacIndex,
  estimatedBloodVolume,
} from '@perfusio/clinical';
import type { CaseCreate, CaseUpdate, PaginationQuery } from '@perfusio/contracts';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { recordAudit, type AuditContext } from '../../platform/audit.js';
import { toPrismaPage, pageMeta, orderBy } from '../../http/pagination.js';

const caseInclude = {
  patient: true,
  surgeon: { select: { id: true, fullName: true } },
  perfusionist: { select: { id: true, fullName: true } },
} as const;

export const casesService = {
  async list(hospitalId: string, q: PaginationQuery, status?: string) {
    const where = {
      hospitalId,
      deletedAt: null,
      ...(status ? { status: status as never } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.case.findMany({ where, include: caseInclude, ...toPrismaPage(q), orderBy: orderBy(q, 'scheduledDate') }),
      prisma.case.count({ where }),
    ]);
    return { data, meta: pageMeta(q, total) };
  },

  async get(hospitalId: string, id: string) {
    const found = await prisma.case.findFirst({
      where: { id, hospitalId, deletedAt: null },
      include: {
        ...caseInclude,
        cannulae: true,
        oxygenator: true,
        cardioplegiaDoses: { orderBy: { givenAt: 'asc' } },
        heparinDoses: { orderBy: { givenAt: 'asc' } },
        protamineDoses: { orderBy: { givenAt: 'asc' } },
        timeline: { orderBy: { occurredAt: 'asc' } },
      },
    });
    if (!found) throw errors.notFound('Case not found');
    return found;
  },

  async create(ctx: AuditContext & { hospitalId: string }, input: CaseCreate) {
    // Verify patient belongs to the same hospital, then derive target flow.
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, hospitalId: ctx.hospitalId, deletedAt: null },
    });
    if (!patient) throw errors.notFound('Patient not found in this hospital');

    let targetFlowLmin: number | null = null;
    if (patient.bsaM2) {
      const ci = recommendedCardiacIndex(Number(patient.weightKg)).max;
      targetFlowLmin = Number(pumpFlow(ci, Number(patient.bsaM2)).toFixed(2));
    }

    // BMH "PATIENT BLOOD VOLUME" — derive Nadler EBV when not supplied.
    const patientBloodVolumeMl =
      input.patientBloodVolumeMl ??
      Math.round(
        estimatedBloodVolume(
          Number(patient.weightKg),
          Number(patient.heightCm),
          patient.sex === 'MALE' ? 'male' : patient.sex === 'FEMALE' ? 'female' : 'unknown',
        ),
      );

    const created = await prisma.case.create({
      data: {
        hospitalId: ctx.hospitalId,
        patientId: input.patientId,
        perfNo: input.perfNo ?? null,
        procedure: input.procedure,
        operatingRoom: input.operatingRoom ?? null,
        scheduledDate: input.scheduledDate,
        priority: input.priority,
        isRedo: input.isRedo,
        status: input.status,
        inductionTime: input.inductionTime ?? null,
        cuttingTime: input.cuttingTime ?? null,
        heparinTime: input.heparinTime ?? null,
        patientBloodVolumeMl,
        notes: input.notes ?? null,
        surgeonId: input.surgeonId ?? null,
        perfusionistId: input.perfusionistId ?? null,
        anesthetistId: input.anesthetistId ?? null,
        assistantPerfusionistId: input.assistantPerfusionistId ?? null,
        targetFlowLmin,
      },
      include: caseInclude,
    });
    await recordAudit({ ctx, action: 'case.create', entity: 'Case', entityId: created.id, after: created });
    return created;
  },

  async update(ctx: AuditContext & { hospitalId: string }, id: string, input: CaseUpdate) {
    const before = await prisma.case.findFirst({ where: { id, hospitalId: ctx.hospitalId, deletedAt: null } });
    if (!before) throw errors.notFound('Case not found');
    const updated = await prisma.case.update({ where: { id }, data: input, include: caseInclude });
    await recordAudit({ ctx, action: 'case.update', entity: 'Case', entityId: id, before, after: updated });
    return updated;
  },

  async softDelete(ctx: AuditContext & { hospitalId: string }, id: string) {
    const before = await prisma.case.findFirst({ where: { id, hospitalId: ctx.hospitalId, deletedAt: null } });
    if (!before) throw errors.notFound('Case not found');
    await prisma.case.update({ where: { id }, data: { deletedAt: new Date() } });
    await recordAudit({ ctx, action: 'case.delete', entity: 'Case', entityId: id, before });
  },

  /**
   * Recompute CPB and cross-clamp durations from the timeline and persist them
   * on the case. Called after any timeline mutation.
   */
  async recomputeDurations(caseId: string): Promise<void> {
    const events = await prisma.timelineEntry.findMany({
      where: { caseId },
      orderBy: { occurredAt: 'asc' },
    });

    const bypassRuns = pairEvents(events, 'CPB_START', 'CPB_END');
    const clampRuns = pairEvents(events, 'CROSS_CLAMP_ON', 'CROSS_CLAMP_OFF');

    const cpbTimeMin = bypassRuns.length
      ? Math.round(totalBypassMinutes(bypassRuns.map((r) => ({ start: r.start, end: r.end }))))
      : null;
    const crossClampTimeMin = clampRuns.length
      ? Math.round(totalCrossClampMinutes(clampRuns.map((r) => ({ applied: r.start, removed: r.end }))))
      : null;

    await prisma.case.update({ where: { id: caseId }, data: { cpbTimeMin, crossClampTimeMin } });
  },
};

/** Pair start/end timeline events in occurrence order into complete intervals. */
function pairEvents(
  events: Array<{ event: string; occurredAt: Date }>,
  startType: string,
  endType: string,
): Array<{ start: Date; end: Date }> {
  const runs: Array<{ start: Date; end: Date }> = [];
  let openStart: Date | null = null;
  for (const e of events) {
    if (e.event === startType) openStart = e.occurredAt;
    else if (e.event === endType && openStart) {
      runs.push({ start: openStart, end: e.occurredAt });
      openStart = null;
    }
  }
  return runs;
}
