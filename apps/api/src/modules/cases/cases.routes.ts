import { Router } from 'express';
import {
  caseCreateSchema,
  caseUpdateSchema,
  paginationQuerySchema,
  type CaseCreate,
  type CaseUpdate,
  type PaginationQuery,
} from '@perfusio/contracts';
import { requirePerm } from '../../http/middleware/auth.js';
import { validate, valid } from '../../http/middleware/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { auditCtx } from '../../http/requestContext.js';
import { casesService } from './cases.service.js';

export const casesRouter = Router();

casesRouter.get(
  '/',
  requirePerm('case', 'read'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const result = await casesService.list(req.auth!.hospitalId, valid<PaginationQuery>(req, 'query'), status);
    res.json(result);
  }),
);

casesRouter.get(
  '/:id',
  requirePerm('case', 'read'),
  asyncHandler(async (req, res) => {
    res.json({ data: await casesService.get(req.auth!.hospitalId, req.params.id!) });
  }),
);

casesRouter.post(
  '/',
  requirePerm('case', 'create'),
  validate(caseCreateSchema),
  asyncHandler(async (req, res) => {
    const created = await casesService.create(auditCtx(req), valid<CaseCreate>(req));
    res.status(201).json({ data: created });
  }),
);

casesRouter.patch(
  '/:id',
  requirePerm('case', 'update'),
  validate(caseUpdateSchema),
  asyncHandler(async (req, res) => {
    const updated = await casesService.update(auditCtx(req), req.params.id!, valid<CaseUpdate>(req));
    res.json({ data: updated });
  }),
);

casesRouter.delete(
  '/:id',
  requirePerm('case', 'delete'),
  asyncHandler(async (req, res) => {
    await casesService.softDelete(auditCtx(req), req.params.id!);
    res.status(204).end();
  }),
);
