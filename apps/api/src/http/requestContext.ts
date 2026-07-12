/** Builds the audit/user context object from an authenticated request. */
import type { Request } from 'express';

export function auditCtx(req: Request) {
  return {
    hospitalId: req.auth!.hospitalId,
    actorId: req.auth!.userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
