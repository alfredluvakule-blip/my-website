/**
 * Research export — returns an anonymized case dataset. Restricted to roles
 * holding research:export. Output carries no direct identifiers (see anonymize).
 */
import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { requirePerm } from '../../http/middleware/auth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { prisma } from '../../platform/db.js';
import { recordAudit } from '../../platform/audit.js';
import { auditCtx } from '../../http/requestContext.js';
import { anonymizeCase } from './anonymize.js';
import { toCsv } from '../reports/csv.js';

export const researchRouter = Router();

researchRouter.get(
  '/dataset',
  requirePerm('research', 'export'),
  asyncHandler(async (req, res) => {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    // A fresh salt per export means pseudonyms are consistent within a file but
    // cannot be linked across exports — a common de-identification safeguard.
    const salt = randomBytes(16).toString('hex');

    const cases = await prisma.case.findMany({
      where: { hospitalId: req.auth!.hospitalId, deletedAt: null, status: 'COMPLETED' },
      include: { patient: true },
    });

    const rows = cases.map((c) => anonymizeCase(c as never, salt));

    await recordAudit({
      ctx: auditCtx(req),
      action: 'research.export',
      entity: 'ResearchDataset',
      after: { count: rows.length, format },
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="perfusio-research.csv"');
      res.send(toCsv(rows));
      return;
    }
    res.json({ data: rows, meta: { count: rows.length, deidentified: true } });
  }),
);
