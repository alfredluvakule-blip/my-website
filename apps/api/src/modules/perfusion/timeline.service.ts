/**
 * Timeline service — records canonical bypass events and keeps the case's
 * derived CPB/cross-clamp durations in sync via casesService.recomputeDurations.
 */
import type { TimelineEntry as TimelineInput } from '@perfusio/contracts';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { recordAudit, type AuditContext } from '../../platform/audit.js';
import { casesService } from '../cases/cases.service.js';

async function assertCase(hospitalId: string, caseId: string) {
  const found = await prisma.case.findFirst({ where: { id: caseId, hospitalId, deletedAt: null } });
  if (!found) throw errors.notFound('Case not found');
}

export const timelineService = {
  async list(hospitalId: string, caseId: string) {
    await assertCase(hospitalId, caseId);
    return prisma.timelineEntry.findMany({ where: { caseId }, orderBy: { occurredAt: 'asc' } });
  },

  async add(ctx: AuditContext & { hospitalId: string }, caseId: string, input: TimelineInput) {
    await assertCase(ctx.hospitalId, caseId);
    const entry = await prisma.timelineEntry.create({
      data: {
        caseId,
        event: input.event,
        occurredAt: input.occurredAt,
        label: input.label ?? null,
        detail: input.detail ?? null,
      },
    });
    await casesService.recomputeDurations(caseId);
    await recordAudit({ ctx, action: 'timeline.add', entity: 'TimelineEntry', entityId: entry.id, after: entry });
    return entry;
  },

  async remove(ctx: AuditContext & { hospitalId: string }, caseId: string, entryId: string) {
    await assertCase(ctx.hospitalId, caseId);
    await prisma.timelineEntry.delete({ where: { id: entryId } });
    await casesService.recomputeDurations(caseId);
    await recordAudit({ ctx, action: 'timeline.remove', entity: 'TimelineEntry', entityId: entryId });
  },
};
