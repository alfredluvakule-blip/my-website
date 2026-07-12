import { describe, it, expect } from 'vitest';
import { evaluateAlerts } from './alertRules.js';

describe('alert rules', () => {
  it('a normal record fires no alerts', () => {
    const alerts = evaluateAlerts(
      {
        act: 520,
        pumpFlowLmin: 4.5,
        reservoirLevelMl: 1200,
        arterialLinePressure: 180,
        venousLinePressure: 5,
        nasopharyngealTempC: 34,
        hematocrit: 28,
        lactate: 1.5,
        potassium: 4.2,
        hemoglobin: 9,
        sao2: 100,
      },
      { bsaM2: 1.9 },
    );
    expect(alerts).toHaveLength(0);
  });

  it('low ACT fires a critical alert', () => {
    const alerts = evaluateAlerts({ act: 400 });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.type).toBe('ACT_BELOW_TARGET');
    expect(alerts[0]!.severity).toBe('CRITICAL');
  });

  it('low flow and low reservoir both fire', () => {
    const alerts = evaluateAlerts({ pumpFlowLmin: 1.2, reservoirLevelMl: 150 });
    const types = alerts.map((a) => a.type);
    expect(types).toContain('LOW_FLOW');
    expect(types).toContain('LOW_RESERVOIR');
  });

  it('critical potassium fires on both high and low', () => {
    expect(evaluateAlerts({ potassium: 6.5 })[0]!.type).toBe('CRITICAL_POTASSIUM');
    expect(evaluateAlerts({ potassium: 2.5 })[0]!.type).toBe('CRITICAL_POTASSIUM');
  });

  it('flags low DO2i when oxygen delivery is inadequate', () => {
    const alerts = evaluateAlerts(
      { hemoglobin: 6, sao2: 95, pumpFlowLmin: 3.0 },
      { bsaM2: 2.2 },
    );
    expect(alerts.some((a) => a.type === 'LOW_DO2I')).toBe(true);
  });

  it('does not evaluate DO2i without BSA', () => {
    const alerts = evaluateAlerts({ hemoglobin: 6, sao2: 95, pumpFlowLmin: 3.0 });
    expect(alerts.some((a) => a.type === 'LOW_DO2I')).toBe(false);
  });
});
