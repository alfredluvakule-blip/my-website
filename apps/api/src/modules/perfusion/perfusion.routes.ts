/**
 * Perfusion routes — nested under a case: monitoring records and timeline.
 * Cannulation, oxygenator, cardioplegia and anticoagulation follow the same
 * pattern and are added here as the intraop record grows.
 */
import { Router } from 'express';
import {
  monitoringRecordSchema,
  timelineEntrySchema,
  cpbIntervalSchema,
  sitePressureSchema,
  actCheckpointSchema,
  bloodProductSchema,
  intraopDrugSchema,
  fluidBalanceEntrySchema,
  type MonitoringRecord,
  type TimelineEntry,
  type CpbInterval,
  type SitePressure,
  type ActCheckpointInput,
  type BloodProduct,
  type IntraopDrug,
  type FluidBalanceEntry,
} from '@perfusio/contracts';
import type { ZodTypeAny } from 'zod';
import { requirePerm } from '../../http/middleware/auth.js';
import { validate, valid } from '../../http/middleware/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { auditCtx } from '../../http/requestContext.js';
import { monitoringService } from './monitoring.service.js';
import { timelineService } from './timeline.service.js';
import { recordsService } from './records.service.js';

// mergeParams so :caseId from the parent mount is visible here.
export const perfusionRouter = Router({ mergeParams: true });

// ── Monitoring ───────────────────────────────────────────────────────────────
perfusionRouter.get(
  '/monitoring',
  requirePerm('perfusion', 'read'),
  asyncHandler(async (req, res) => {
    res.json({ data: await monitoringService.list(req.auth!.hospitalId, req.params.caseId!) });
  }),
);

perfusionRouter.post(
  '/monitoring',
  requirePerm('perfusion', 'create'),
  validate(monitoringRecordSchema),
  asyncHandler(async (req, res) => {
    const result = await monitoringService.create(
      auditCtx(req),
      req.params.caseId!,
      valid<MonitoringRecord>(req),
    );
    res.status(201).json({ data: result.record, alerts: result.alerts });
  }),
);

// ── Timeline ─────────────────────────────────────────────────────────────────
perfusionRouter.get(
  '/timeline',
  requirePerm('perfusion', 'read'),
  asyncHandler(async (req, res) => {
    res.json({ data: await timelineService.list(req.auth!.hospitalId, req.params.caseId!) });
  }),
);

perfusionRouter.post(
  '/timeline',
  requirePerm('perfusion', 'create'),
  validate(timelineEntrySchema),
  asyncHandler(async (req, res) => {
    const entry = await timelineService.add(auditCtx(req), req.params.caseId!, valid<TimelineEntry>(req));
    res.status(201).json({ data: entry });
  }),
);

perfusionRouter.delete(
  '/timeline/:entryId',
  requirePerm('perfusion', 'update'),
  asyncHandler(async (req, res) => {
    await timelineService.remove(auditCtx(req), req.params.caseId!, req.params.entryId!);
    res.status(204).end();
  }),
);

// ── BMH structured sub-records ──────────────────────────────────────────────
// Each resource shares the same list/create shape, so it is registered from a
// small table to avoid repeating boilerplate per endpoint.
type Ctx = ReturnType<typeof auditCtx>;
interface SubResource {
  path: string;
  schema: ZodTypeAny;
  list: (hospitalId: string, caseId: string) => Promise<unknown>;
  add: (ctx: Ctx, caseId: string, input: unknown) => Promise<unknown>;
}

const subResources: SubResource[] = [
  {
    path: 'intervals',
    schema: cpbIntervalSchema,
    list: recordsService.listIntervals,
    add: (ctx: Ctx, id: string, i: unknown) => recordsService.addInterval(ctx, id, i as CpbInterval),
  },
  {
    path: 'site-pressures',
    schema: sitePressureSchema,
    list: recordsService.listSitePressures,
    add: (ctx: Ctx, id: string, i: unknown) => recordsService.addSitePressure(ctx, id, i as SitePressure),
  },
  {
    path: 'act-checkpoints',
    schema: actCheckpointSchema,
    list: recordsService.listActCheckpoints,
    add: (ctx: Ctx, id: string, i: unknown) =>
      recordsService.addActCheckpoint(ctx, id, i as ActCheckpointInput),
  },
  {
    path: 'blood-products',
    schema: bloodProductSchema,
    list: recordsService.listBloodProducts,
    add: (ctx: Ctx, id: string, i: unknown) => recordsService.addBloodProduct(ctx, id, i as BloodProduct),
  },
  {
    path: 'drugs',
    schema: intraopDrugSchema,
    list: recordsService.listDrugs,
    add: (ctx: Ctx, id: string, i: unknown) => recordsService.addDrug(ctx, id, i as IntraopDrug),
  },
  {
    path: 'fluid-balance',
    schema: fluidBalanceEntrySchema,
    list: recordsService.listFluidEntries,
    add: (ctx: Ctx, id: string, i: unknown) => recordsService.addFluidEntry(ctx, id, i as FluidBalanceEntry),
  },
];

for (const r of subResources) {
  perfusionRouter.get(
    `/${r.path}`,
    requirePerm('perfusion', 'read'),
    asyncHandler(async (req, res) => {
      res.json({ data: await r.list(req.auth!.hospitalId, req.params.caseId!) });
    }),
  );
  perfusionRouter.post(
    `/${r.path}`,
    requirePerm('perfusion', 'create'),
    validate(r.schema),
    asyncHandler(async (req, res) => {
      const created = await r.add(auditCtx(req), req.params.caseId!, valid(req) as never);
      res.status(201).json({ data: created });
    }),
  );
}
