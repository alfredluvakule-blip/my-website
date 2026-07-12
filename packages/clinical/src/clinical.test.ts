import { describe, it, expect } from 'vitest';
import {
  bsaDuBois,
  bsaMosteller,
  bmi,
  pumpFlow,
  cardiacIndex,
  recommendedCardiacIndex,
  arterialOxygenContent,
  oxygenDelivery,
  indexedOxygenDelivery,
  computeDo2i,
  DO2I_CRITICAL_THRESHOLD,
  estimatedBloodVolume,
  predictedHematocrit,
  hemoglobinFromHematocrit,
  primeRbcToTarget,
  heparinLoadingDose,
  protamineDose,
  evaluateAct,
  heparinTopUp,
  netFluidBalance,
  totalIn,
  totalOut,
  elapsedMinutes,
  totalBypassMinutes,
  totalCrossClampMinutes,
  formatDuration,
  estimatedPrimeVolume,
  summedPrimeVolume,
} from './index.js';

const near = (a: number, b: number, eps = 1e-2) => Math.abs(a - b) < eps;

describe('anthropometrics', () => {
  it('Du Bois BSA for a 70kg / 170cm adult ≈ 1.81 m²', () => {
    expect(near(bsaDuBois(70, 170), 1.81, 0.02)).toBe(true);
  });
  it('Mosteller BSA for a 70kg / 170cm adult ≈ 1.82 m²', () => {
    expect(near(bsaMosteller(70, 170), 1.82, 0.02)).toBe(true);
  });
  it('BMI for 70kg / 170cm ≈ 24.2', () => {
    expect(near(bmi(70, 170), 24.22, 0.05)).toBe(true);
  });
  it('rejects non-physiologic weight', () => {
    expect(() => bsaDuBois(500, 170)).toThrow(RangeError);
  });
});

describe('flow', () => {
  it('pump flow = CI × BSA', () => {
    expect(near(pumpFlow(2.4, 1.8), 4.32)).toBe(true);
  });
  it('cardiac index is the inverse of pump flow', () => {
    expect(near(cardiacIndex(4.32, 1.8), 2.4)).toBe(true);
  });
  it('neonates get a higher recommended CI than adults', () => {
    expect(recommendedCardiacIndex(3).min).toBeGreaterThan(recommendedCardiacIndex(70).min);
  });
});

describe('oxygen delivery', () => {
  it('CaO2 for Hb 12, SaO2 1.0, PaO2 200 ≈ 16.68 mL/dL', () => {
    // 1.34*12*1.0 = 16.08 ; +0.003*200 = 0.6 → 16.68
    expect(near(arterialOxygenContent(12, 1.0, 200), 16.68)).toBe(true);
  });
  it('DO2 = CaO2 × flow × 10', () => {
    expect(near(oxygenDelivery(16.68, 4.5), 750.6, 0.1)).toBe(true);
  });
  it('DO2i divides by BSA', () => {
    expect(near(indexedOxygenDelivery(750.6, 1.8), 417.0, 0.1)).toBe(true);
  });
  it('flags DO2i below the critical threshold', () => {
    const low = computeDo2i({ hbGdl: 6, sao2Fraction: 1, pao2Mmhg: 150, flowLmin: 3, bsaM2: 2 });
    expect(low.do2i).toBeLessThan(DO2I_CRITICAL_THRESHOLD);
    expect(low.belowCritical).toBe(true);
  });
});

describe('hemodilution', () => {
  it('Nadler EBV differs by sex', () => {
    const male = estimatedBloodVolume(70, 175, 'male');
    const female = estimatedBloodVolume(70, 175, 'female');
    expect(male).toBeGreaterThan(female);
  });
  it('predicted hematocrit falls after crystalloid prime', () => {
    const hct = predictedHematocrit({ bloodVolumeMl: 5000, hctPrePercent: 40, primeVolumeMl: 1500 });
    // 5000*40 / 6500 ≈ 30.8
    expect(near(hct, 30.77, 0.1)).toBe(true);
    expect(hct).toBeLessThan(40);
  });
  it('hemoglobin ≈ hct / 3', () => {
    expect(near(hemoglobinFromHematocrit(30), 10)).toBe(true);
  });
  it('suggests PRBC when dilution misses the target hematocrit', () => {
    const ml = primeRbcToTarget({
      bloodVolumeMl: 5000,
      hctPrePercent: 40,
      primeVolumeMl: 1500,
      targetHctPercent: 34,
    });
    expect(ml).toBeGreaterThan(0);
  });
  it('suggests zero PRBC when dilution already meets target', () => {
    const ml = primeRbcToTarget({
      bloodVolumeMl: 5000,
      hctPrePercent: 45,
      primeVolumeMl: 500,
      targetHctPercent: 30,
    });
    expect(ml).toBe(0);
  });
});

describe('anticoagulation', () => {
  it('heparin loading dose = weight × IU/kg', () => {
    expect(heparinLoadingDose(80, 300)).toBe(24000);
  });
  it('protamine dose = 1 mg per 100 IU by default', () => {
    expect(protamineDose(24000)).toBe(240);
  });
  it('ACT below target is inadequate with a positive deficit', () => {
    const v = evaluateAct(400, 480);
    expect(v.adequate).toBe(false);
    expect(v.deficit).toBe(80);
  });
  it('ACT at/above target is adequate with zero deficit', () => {
    expect(evaluateAct(520, 480)).toEqual({ adequate: true, deficit: 0 });
  });
  it('suggests a heparin top-up only when below target', () => {
    expect(heparinTopUp({ weightKg: 70, currentAct: 520 })).toBe(0);
    expect(heparinTopUp({ weightKg: 70, currentAct: 400 })).toBeGreaterThan(0);
  });
});

describe('fluid balance', () => {
  const ledger = {
    in: { primeVolume: 1500, cardioplegia: 1000, crystalloid: 500 },
    out: { urine: 800, ultrafiltration: 1200, bloodLoss: 300 },
  };
  it('sums inputs and outputs', () => {
    expect(totalIn(ledger)).toBe(3000);
    expect(totalOut(ledger)).toBe(2300);
  });
  it('net balance = in − out', () => {
    expect(netFluidBalance(ledger)).toBe(700);
  });
});

describe('timeline', () => {
  it('elapsed minutes between two timestamps', () => {
    expect(elapsedMinutes('2026-07-11T08:02:00Z', '2026-07-11T09:30:00Z')).toBe(88);
  });
  it('throws when end precedes start', () => {
    expect(() => elapsedMinutes('2026-07-11T09:30:00Z', '2026-07-11T08:02:00Z')).toThrow(RangeError);
  });
  it('sums bypass runs', () => {
    const total = totalBypassMinutes([
      { start: '2026-07-11T08:02:00Z', end: '2026-07-11T09:30:00Z' },
      { start: '2026-07-11T10:00:00Z', end: '2026-07-11T10:20:00Z' },
    ]);
    expect(total).toBe(108);
  });
  it('sums cross-clamp cycles', () => {
    const total = totalCrossClampMinutes([
      { applied: '2026-07-11T08:30:00Z', removed: '2026-07-11T09:10:00Z' },
    ]);
    expect(total).toBe(40);
  });
  it('formats durations as H:MM', () => {
    expect(formatDuration(88)).toBe('1:28');
    expect(formatDuration(9)).toBe('0:09');
  });
});

describe('prime', () => {
  it('estimates prime by weight band', () => {
    expect(estimatedPrimeVolume(3)).toBe(250);
    expect(estimatedPrimeVolume(70)).toBe(1500);
  });
  it('sums component priming volumes', () => {
    expect(summedPrimeVolume({ oxygenator: 260, arterialTubing: 80, venousTubing: 120 })).toBe(460);
  });
});
