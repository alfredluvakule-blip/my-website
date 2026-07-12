'use client';

import { useState } from 'react';
import { computeDo2i } from '@perfusio/clinical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { formatNumber } from '@/lib/utils';

/**
 * Quick intraoperative monitoring entry. Captures the core vitals a
 * perfusionist logs each interval and previews DO2i live (same clinical
 * function the server uses) before submitting to the API, which re-derives it
 * and evaluates alerts.
 */
export function MonitoringEntryForm({
  bsaM2,
  submitting,
  onSubmit,
}: {
  bsaM2?: number;
  submitting: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [v, setV] = useState<Record<string, string>>({});

  function num(key: string): number | undefined {
    const n = Number(v[key]);
    return v[key] === undefined || v[key] === '' || Number.isNaN(n) ? undefined : n;
  }

  const flow = num('pumpFlowLmin');
  const hb = num('hemoglobin');
  const sao2 = num('sao2');
  const do2iPreview =
    bsaM2 && flow && hb && sao2
      ? computeDo2i({ hbGdl: hb, sao2Fraction: sao2 / 100, pao2Mmhg: 150, flowLmin: flow, bsaM2 })
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      recordedAt: new Date().toISOString(),
      heartRate: num('heartRate'),
      map: num('map'),
      nasopharyngealTempC: num('nasopharyngealTempC'),
      pumpFlowLmin: flow,
      pumpRpm: num('pumpRpm'),
      arterialLinePressure: num('arterialLinePressure'),
      venousLinePressure: num('venousLinePressure'),
      reservoirLevelMl: num('reservoirLevelMl'),
      hematocrit: num('hematocrit'),
      hemoglobin: hb,
      sao2,
      act: num('act'),
      urineOutputMl: num('urineOutputMl'),
    };
    // Drop undefined so optional fields validate cleanly.
    for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];
    onSubmit(payload);
    setV({});
  }

  const fields: Array<[string, string, string]> = [
    ['pumpFlowLmin', 'Flow', 'L/min'],
    ['pumpRpm', 'RPM', ''],
    ['map', 'MAP', 'mmHg'],
    ['nasopharyngealTempC', 'Temp', '°C'],
    ['arterialLinePressure', 'Art. P', 'mmHg'],
    ['venousLinePressure', 'Ven. P', 'mmHg'],
    ['reservoirLevelMl', 'Reservoir', 'mL'],
    ['hematocrit', 'Hct', '%'],
    ['hemoglobin', 'Hb', 'g/dL'],
    ['sao2', 'SaO₂', '%'],
    ['act', 'ACT', 's'],
    ['urineOutputMl', 'Urine', 'mL'],
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>New monitoring record</CardTitle>
        {do2iPreview && (
          <span
            className={`text-sm font-medium ${do2iPreview.belowCritical ? 'text-danger' : 'text-success'}`}
          >
            DO₂i preview: {formatNumber(do2iPreview.do2i, 0)} mL/min/m²
            {do2iPreview.belowCritical ? ' — below critical' : ''}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {fields.map(([key, label, unit]) => (
            <div key={key} className="flex flex-col gap-1">
              <Label className="text-xs">
                {label} {unit && <span className="text-muted-foreground">{unit}</span>}
              </Label>
              <Input
                type="number"
                step="any"
                inputMode="decimal"
                value={v[key] ?? ''}
                onChange={(e) => setV((s) => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="col-span-full flex justify-end">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? 'Recording…' : 'Record'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
