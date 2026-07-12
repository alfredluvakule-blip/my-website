/**
 * Role-based access control matrix.
 *
 * Permissions are expressed as `resource:action` strings. Each role maps to a
 * set of permissions; `*` grants all actions on a resource. This is the single
 * source of truth for authorization on the server; the UI mirrors a subset to
 * hide controls, but the server is authoritative.
 */
import type { UserRole } from '@perfusio/contracts';

export type Permission = string; // `${resource}:${action}` or `${resource}:*`

const ALL = '*';

/**
 * Resources: patient, case, perfusion (all intraop data), equipment, report,
 * research, analytics, audit, user.
 * Actions: read, create, update, delete, export, sign, admin.
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMINISTRATOR: [`${ALL}:${ALL}`],

  PERFUSIONIST: [
    'patient:read',
    'patient:create',
    'patient:update',
    'case:read',
    'case:create',
    'case:update',
    'perfusion:read',
    'perfusion:create',
    'perfusion:update',
    'equipment:read',
    'equipment:update',
    'report:read',
    'report:export',
    'analytics:read',
  ],

  CONSULTANT: [
    'patient:read',
    'case:read',
    'case:update',
    'perfusion:read',
    'report:read',
    'report:export',
    'report:sign',
    'analytics:read',
  ],

  CARDIAC_SURGEON: [
    'patient:read',
    'case:read',
    'case:update',
    'perfusion:read',
    'report:read',
    'report:export',
    'report:sign',
    'analytics:read',
  ],

  ANESTHESIOLOGIST: [
    'patient:read',
    'case:read',
    'perfusion:read',
    'perfusion:create',
    'perfusion:update',
    'report:read',
    'analytics:read',
  ],

  NURSE: ['patient:read', 'case:read', 'perfusion:read', 'equipment:read'],

  RESIDENT: [
    'patient:read',
    'case:read',
    'perfusion:read',
    'perfusion:create',
    'report:read',
    'analytics:read',
  ],

  STUDENT: ['patient:read', 'case:read', 'perfusion:read', 'analytics:read'],

  RESEARCHER: ['analytics:read', 'research:read', 'research:export'],

  GUEST: ['case:read', 'analytics:read'],
};

/** True if the role holds the given `resource:action` permission. */
export function can(role: UserRole, resource: string, action: string): boolean {
  const grants = ROLE_PERMISSIONS[role] ?? [];
  return (
    grants.includes(`${ALL}:${ALL}`) ||
    grants.includes(`${resource}:${ALL}`) ||
    grants.includes(`${resource}:${action}`)
  );
}

export function permissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
