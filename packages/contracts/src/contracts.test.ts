import { describe, it, expect } from 'vitest';
import { patientCreateSchema, monitoringRecordSchema, paginationQuerySchema } from './index.js';

describe('patient contract', () => {
  it('accepts a valid patient and applies defaults', () => {
    const parsed = patientCreateSchema.parse({
      hospitalNumber: 'MRN-1',
      name: 'Test',
      sex: 'MALE',
      weightKg: 70,
      heightCm: 175,
    });
    expect(parsed.bloodGroup).toBe('UNKNOWN');
    expect(parsed.allergies).toEqual([]);
  });

  it('rejects an impossible weight', () => {
    const r = patientCreateSchema.safeParse({
      hospitalNumber: 'MRN-1',
      name: 'Test',
      sex: 'MALE',
      weightKg: 999,
      heightCm: 175,
    });
    expect(r.success).toBe(false);
  });
});

describe('monitoring contract', () => {
  it('rejects a non-physiologic pH', () => {
    const r = monitoringRecordSchema.safeParse({
      recordedAt: new Date().toISOString(),
      abg: { ph: 12 },
    });
    expect(r.success).toBe(false);
  });
});

describe('pagination contract', () => {
  it('coerces and defaults query params', () => {
    const p = paginationQuerySchema.parse({ page: '2' });
    expect(p.page).toBe(2);
    expect(p.pageSize).toBe(20);
    expect(p.order).toBe('desc');
  });
});
