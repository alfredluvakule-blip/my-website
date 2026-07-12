import { describe, it, expect } from 'vitest';
import { pseudonymize, bandAge, anonymizeCase } from './anonymize.js';

describe('research anonymization', () => {
  it('pseudonyms are deterministic per salt and diverge across salts', () => {
    expect(pseudonymize('abc', 's1')).toBe(pseudonymize('abc', 's1'));
    expect(pseudonymize('abc', 's1')).not.toBe(pseudonymize('abc', 's2'));
  });

  it('bands ages into decades', () => {
    expect(bandAge(0.5)).toBe('<1');
    expect(bandAge(7)).toBe('0-9');
    expect(bandAge(64)).toBe('60-69');
    expect(bandAge(null)).toBeNull();
  });

  it('strips all direct identifiers from the output', () => {
    const raw = {
      id: 'case1',
      procedure: 'CABG x3',
      priority: 'ELECTIVE',
      isRedo: false,
      cpbTimeMin: 88,
      crossClampTimeMin: 40,
      name: 'John Doe',
      hospitalNumber: 'MRN-123',
      patient: {
        id: 'patient1',
        age: 64,
        sex: 'MALE',
        weightKg: 80,
        heightCm: 175,
        bsaM2: 1.96,
        bmi: 26.1,
        bloodGroup: 'O_POS',
        name: 'John Doe',
        hospitalNumber: 'MRN-123',
      },
    };
    const out = anonymizeCase(raw as never, 'export-salt') as Record<string, unknown>;
    expect(out.name).toBeUndefined();
    expect(out.hospitalNumber).toBeUndefined();
    expect(out.subjectId).toHaveLength(16);
    expect(out.ageBand).toBe('60-69');
    expect(out.cpbTimeMin).toBe(88);
  });
});
