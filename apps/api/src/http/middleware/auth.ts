/**
 * Authentication + authorization middleware.
 *
 * Verifies the Supabase-issued JWT (HS256, project JWT secret), loads the
 * caller's profile/role/hospital, and exposes it on `req.auth`. `requirePerm`
 * enforces the RBAC matrix per route.
 */
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@perfusio/contracts';
import { config } from '../../platform/config.js';
import { prisma } from '../../platform/db.js';
import { errors } from '../../platform/errors.js';
import { can } from '../../modules/identity/permissions.js';

export interface AuthContext {
  userId: string;
  hospitalId: string;
  role: UserRole;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/** Verify JWT and attach the caller's profile. */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw errors.unauthorized('Missing bearer token');
    const token = header.slice('Bearer '.length);

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, config.SUPABASE_JWT_SECRET, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;
    } catch {
      throw errors.unauthorized('Invalid or expired token');
    }

    const userId = payload.sub;
    if (!userId) throw errors.unauthorized('Token has no subject');

    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile || !profile.isActive || profile.deletedAt) {
      throw errors.unauthorized('No active profile for this user');
    }

    req.auth = {
      userId: profile.id,
      hospitalId: profile.hospitalId,
      role: profile.role as UserRole,
      email: profile.email,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Guard a route by required permission. */
export function requirePerm(resource: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(errors.unauthorized());
    if (!can(req.auth.role, resource, action)) {
      return next(errors.forbidden(`Requires ${resource}:${action}`));
    }
    next();
  };
}
