import { Router } from 'express';
import { z } from 'zod';
import { EquipmentCategory, paginationQuerySchema, type PaginationQuery } from '@perfusio/contracts';
import { requirePerm } from '../../http/middleware/auth.js';
import { validate, valid } from '../../http/middleware/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { auditCtx } from '../../http/requestContext.js';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { recordAudit } from '../../platform/audit.js';
import { toPrismaPage, pageMeta, orderBy } from '../../http/pagination.js';

const equipmentCreateSchema = z.object({
  category: EquipmentCategory,
  manufacturer: z.string().min(1).max(200),
  model: z.string().min(1).max(200),
  specification: z.record(z.unknown()).optional(),
  imageUrl: z.string().url().optional(),
  lotNumber: z.string().max(120).optional(),
  expiryDate: z.coerce.date().optional(),
  quantityOnHand: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});
type EquipmentCreate = z.infer<typeof equipmentCreateSchema>;

export const equipmentRouter = Router();

equipmentRouter.get(
  '/',
  requirePerm('equipment', 'read'),
  validate(paginationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = valid<PaginationQuery>(req, 'query');
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const where = {
      hospitalId: req.auth!.hospitalId,
      deletedAt: null,
      ...(category ? { category: category as never } : {}),
      ...(q.q
        ? {
            OR: [
              { manufacturer: { contains: q.q, mode: 'insensitive' as const } },
              { model: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      prisma.equipmentItem.findMany({ where, ...toPrismaPage(q), orderBy: orderBy(q) }),
      prisma.equipmentItem.count({ where }),
    ]);
    res.json({ data, meta: pageMeta(q, total) });
  }),
);

equipmentRouter.post(
  '/',
  requirePerm('equipment', 'update'),
  validate(equipmentCreateSchema),
  asyncHandler(async (req, res) => {
    const input = valid<EquipmentCreate>(req);
    const item = await prisma.equipmentItem.create({
      data: {
        ...input,
        hospitalId: req.auth!.hospitalId,
        specification: (input.specification ?? undefined) as never,
      },
    });
    await recordAudit({ ctx: auditCtx(req), action: 'equipment.create', entity: 'EquipmentItem', entityId: item.id, after: item });
    res.status(201).json({ data: item });
  }),
);

equipmentRouter.patch(
  '/:id',
  requirePerm('equipment', 'update'),
  validate(equipmentCreateSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.equipmentItem.findFirst({
      where: { id: req.params.id!, hospitalId: req.auth!.hospitalId, deletedAt: null },
    });
    if (!existing) throw errors.notFound('Equipment not found');
    const item = await prisma.equipmentItem.update({
      where: { id: req.params.id! },
      data: valid<Partial<EquipmentCreate>>(req) as never,
    });
    res.json({ data: item });
  }),
);
