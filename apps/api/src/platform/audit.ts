/** Append-only audit trail writer. Every mutation of clinical data is recorded. */
import { prisma } from './db.js';
import { logger } from './logger.js';

export interface AuditContext {
  hospitalId?: string;
  actorId?: string;
  ip?: string;
  userAgent?: string;
}

export async function recordAudit(params: {
  ctx: AuditContext;
  action: string; // e.g. 'patient.create'
  entity: string; // e.g. 'Patient'
  entityId?: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        hospitalId: params.ctx.hospitalId ?? null,
        actorId: params.ctx.actorId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        before: (params.before as object) ?? undefined,
        after: (params.after as object) ?? undefined,
        ip: params.ctx.ip ?? null,
        userAgent: params.ctx.userAgent ?? null,
      },
    });
  } catch (err) {
    // Auditing must never break the request path, but a failure is significant.
    logger.error({ err, action: params.action }, 'failed to write audit log');
  }
}
