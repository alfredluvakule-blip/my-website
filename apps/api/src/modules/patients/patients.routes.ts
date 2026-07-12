import { Router } from 'express';
import {
  patientCreateSchema,
  patientUpdateSchema,
  paginationQuerySchema,
  type PatientCreate,
  type PatientUpdate,
  type PaginationQuery,
} from '@perfusio/contracts';
import { requirePerm } from '../../http/middleware/auth.js';
import { validate, valid } from '../../http/middleware/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { auditCtx } from '../../http/requestContext.js';
import { patientsService } from './patients.service.js';

export const patientsRouter = Router();

patientsRouter.get(
  '/',
  requirePerm('patient', 'read'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await patientsService.list(req.auth!.hospitalId, valid<PaginationQuery>(req, 'query'));
    res.json(result);
  }),
);

patientsRouter.get(
  '/:id',
  requirePerm('patient', 'read'),
  asyncHandler(async (req, res) => {
    const patient = await patientsService.get(req.auth!.hospitalId, req.params.id!);
    res.json({ data: patient });
  }),
);

patientsRouter.post(
  '/',
  requirePerm('patient', 'create'),
  validate(patientCreateSchema),
  asyncHandler(async (req, res) => {
    const patient = await patientsService.create(auditCtx(req), valid<PatientCreate>(req));
    res.status(201).json({ data: patient });
  }),
);

patientsRouter.patch(
  '/:id',
  requirePerm('patient', 'update'),
  validate(patientUpdateSchema),
  asyncHandler(async (req, res) => {
    const patient = await patientsService.update(auditCtx(req), req.params.id!, valid<PatientUpdate>(req));
    res.json({ data: patient });
  }),
);

patientsRouter.delete(
  '/:id',
  requirePerm('patient', 'delete'),
  asyncHandler(async (req, res) => {
    await patientsService.softDelete(auditCtx(req), req.params.id!);
    res.status(204).end();
  }),
);
