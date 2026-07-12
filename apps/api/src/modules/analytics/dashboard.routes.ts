import { Router } from 'express';
import { requirePerm } from '../../http/middleware/auth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { dashboardService } from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/summary',
  requirePerm('analytics', 'read'),
  asyncHandler(async (req, res) => {
    res.json({ data: await dashboardService.summary(req.auth!.hospitalId) });
  }),
);

dashboardRouter.get(
  '/cases-by-month',
  requirePerm('analytics', 'read'),
  asyncHandler(async (req, res) => {
    res.json({ data: await dashboardService.casesByMonth(req.auth!.hospitalId) });
  }),
);
