/**
 * JKCI structured sub-records: the ON/OFF/TOTAL interval table, SITE/SAT/PRESS
 * table, A.C.T checkpoints, blood products, intraop drugs, and fluid balance.
 *
 * CpbInterval totals are derived from onAt/offAt by @perfusio/clinical so the
 * TOTAL column can never disagree with the ON/OFF times entered.
 */
import { elapsedMinutes } from '@perfusio/clinical';
import type {
  CpbInterval,
  SitePressure,
  ActCheckpointInput,
  BloodProduct,
  IntraopDrug,
  FluidBalanceEntry,
} from '@perfusio/contracts';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { recordAudit, type AuditContext } from '../../platform/audit.js';

async function assertCase(hospitalId: string, caseId: string) {
  const found = await prisma.case.findFirst({ where: { id: caseId, hospitalId, deletedAt: null } });
  if (!found) throw errors.notFound('Case not found');
}

type Ctx = AuditContext & { hospitalId: string };

export const recordsService = {
  // ── CPB intervals (ON / OFF / TOTAL) ──────────────────────────────────────
  async listIntervals(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.cpbInterval.findMany({ where: { caseId }, orderBy: { onAt: 'asc' } });
  },
  async addInterval(ctx: Ctx, caseId: string, input: CpbInterval) {
    await assertCase(ctx.hospitalId, caseId);
    const totalMin = input.offAt ? Math.round(elapsedMinutes(input.onAt, input.offAt)) : null;
    const created = await prisma.cpbInterval.create({
      data: { caseId, type: input.type, onAt: input.onAt, offAt: input.offAt ?? null, totalMin },
    });
    await recordAudit({ ctx, action: 'interval.add', entity: 'CpbInterval', entityId: created.id, after: created });
    return created;
  },

  // ── Site pressures / saturations ──────────────────────────────────────────
  async listSitePressures(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.sitePressure.findMany({ where: { caseId }, orderBy: { createdAt: 'asc' } });
  },
  async addSitePressure(ctx: Ctx, caseId: string, input: SitePressure) {
    await assertCase(ctx.hospitalId, caseId);
    const created = await prisma.sitePressure.create({
      data: {
        caseId,
        site: input.site,
        saturationPercent: input.saturationPercent ?? null,
        pressureMmhg: input.pressureMmhg ?? null,
        measuredAt: input.measuredAt ?? null,
      },
    });
    await recordAudit({ ctx, action: 'sitePressure.add', entity: 'SitePressure', entityId: created.id });
    return created;
  },

  // ── ACT checkpoints ───────────────────────────────────────────────────────
  async listActCheckpoints(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.actCheckpointRecord.findMany({ where: { caseId }, orderBy: { measuredAt: 'asc' } });
  },
  async addActCheckpoint(ctx: Ctx, caseId: string, input: ActCheckpointInput) {
    await assertCase(ctx.hospitalId, caseId);
    const created = await prisma.actCheckpointRecord.create({
      data: { caseId, checkpoint: input.checkpoint, actSeconds: input.actSeconds, measuredAt: input.measuredAt },
    });
    await recordAudit({ ctx, action: 'actCheckpoint.add', entity: 'ActCheckpointRecord', entityId: created.id });
    return created;
  },

  // ── Blood products ────────────────────────────────────────────────────────
  async listBloodProducts(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.bloodProduct.findMany({ where: { caseId }, orderBy: { givenAt: 'asc' } });
  },
  async addBloodProduct(ctx: Ctx, caseId: string, input: BloodProduct) {
    await assertCase(ctx.hospitalId, caseId);
    const created = await prisma.bloodProduct.create({
      data: {
        caseId,
        product: input.product,
        unitNumber: input.unitNumber ?? null,
        volumeMl: input.volumeMl ?? null,
        givenAt: input.givenAt,
      },
    });
    await recordAudit({ ctx, action: 'bloodProduct.add', entity: 'BloodProduct', entityId: created.id });
    return created;
  },

  // ── Intraop drugs ─────────────────────────────────────────────────────────
  async listDrugs(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.intraopDrug.findMany({ where: { caseId }, orderBy: { givenAt: 'asc' } });
  },
  async addDrug(ctx: Ctx, caseId: string, input: IntraopDrug) {
    await assertCase(ctx.hospitalId, caseId);
    const created = await prisma.intraopDrug.create({
      data: { caseId, drug: input.drug, quantity: input.quantity, givenAt: input.givenAt },
    });
    await recordAudit({ ctx, action: 'drug.add', entity: 'IntraopDrug', entityId: created.id });
    return created;
  },

  // ── Fluid balance ─────────────────────────────────────────────────────────
  async listFluidEntries(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.fluidBalanceEntry.findMany({ where: { caseId }, orderBy: { createdAt: 'asc' } });
  },
  async addFluidEntry(ctx: Ctx, caseId: string, input: FluidBalanceEntry) {
    await assertCase(ctx.hospitalId, caseId);
    const created = await prisma.fluidBalanceEntry.create({
      data: {
        caseId,
        direction: input.direction,
        intakeType: input.intakeType ?? null,
        outputType: input.outputType ?? null,
        volumeMl: input.volumeMl,
        recordedAt: input.recordedAt ?? null,
      },
    });
    await recordAudit({ ctx, action: 'fluidEntry.add', entity: 'FluidBalanceEntry', entityId: created.id });
    return created;
  },
};
