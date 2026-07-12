/**
 * Perfusion routes — nested under a case: monitoring records and timeline.
 * Cannulation, oxygenator, cardioplegia and anticoagulation follow the same
 * pattern and are added here as the intraop record grows.
 */
import { Router } from 'express';
import {
  monitoringRecordSchema,
  timelineEntrySchema,
  type MonitoringRecord,
  type TimelineEntry,
} from '@perfusio/contracts';
import { requirePerm } from '../../http/middleware/auth.js';
import { validate, valid } from '../../http/middleware/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { auditCtx } from '../../http/requestContext.js';
import { monitoringService } from './monitoring.service.js';
import { timelineService } from './timeline.service.js';

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
