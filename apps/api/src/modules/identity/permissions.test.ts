import { describe, it, expect } from 'vitest';
import { can, permissionsForRole } from './permissions.js';

describe('RBAC', () => {
  it('administrator can do anything', () => {
    expect(can('ADMINISTRATOR', 'patient', 'delete')).toBe(true);
    expect(can('ADMINISTRATOR', 'research', 'export')).toBe(true);
  });

  it('perfusionist can record perfusion data but cannot sign reports', () => {
    expect(can('PERFUSIONIST', 'perfusion', 'create')).toBe(true);
    expect(can('PERFUSIONIST', 'report', 'sign')).toBe(false);
  });

  it('surgeon can sign reports', () => {
    expect(can('CARDIAC_SURGEON', 'report', 'sign')).toBe(true);
  });

  it('researcher only touches research/analytics, never PHI writes', () => {
    expect(can('RESEARCHER', 'research', 'export')).toBe(true);
    expect(can('RESEARCHER', 'patient', 'read')).toBe(false);
    expect(can('RESEARCHER', 'patient', 'create')).toBe(false);
  });

  it('guest is read-only and narrow', () => {
    expect(can('GUEST', 'case', 'read')).toBe(true);
    expect(can('GUEST', 'case', 'update')).toBe(false);
    expect(can('GUEST', 'patient', 'read')).toBe(false);
  });

  it('student cannot create anything', () => {
    const perms = permissionsForRole('STUDENT');
    expect(perms.some((p) => p.endsWith(':create'))).toBe(false);
  });
});
