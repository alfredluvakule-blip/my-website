'use client';

import { useMemo } from 'react';
import {
  bsaDuBois,
  bmi as calcBmi,
  estimatedBloodVolume,
  predictedHematocrit,
  hemoglobinFromHematocrit,
  estimatedPrimeVolume,
  pumpFlow,
  recommendedCardiacIndex,
  heparinLoadingDose,
} from '@perfusio/clinical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

/**
 * Live clinical calculator panel. Every number here comes from @perfusio/clinical
 * — the exact same functions the API uses to persist derived values — so the
 * preview a perfusionist sees always matches what gets stored.
 */
export function ClinicalCalculators({
  weightKg,
  heightCm,
  sex,
  hctPre = 40,
}: {
  weightKg: number;
  heightCm: number;
  sex: 'male' | 'female' | 'unknown';
  hctPre?: number;
}) {
  const derived = useMemo(() => {
    if (!weightKg || !heightCm) return null;
    try {
      const bsa = bsaDuBois(weightKg, heightCm);
      const ci = recommendedCardiacIndex(weightKg).max;
      const prime = estimatedPrimeVolume(weightKg);
      const ebv = estimatedBloodVolume(weightKg, heightCm, sex);
      const hctOnBypass = predictedHematocrit({
        bloodVolumeMl: ebv,
        hctPrePercent: hctPre,
        primeVolumeMl: prime,
      });
      return {
        bsa,
        bmi: calcBmi(weightKg, heightCm),
        targetFlow: pumpFlow(ci, bsa),
        prime,
        heparin: heparinLoadingDose(weightKg),
        hctOnBypass,
        hbOnBypass: hemoglobinFromHematocrit(hctOnBypass),
      };
    } catch {
      return null;
    }
  }, [weightKg, heightCm, sex, hctPre]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic calculations</CardTitle>
        <p className="text-sm text-muted-foreground">Derived live from weight, height and sex.</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric label="BSA (Du Bois)" value={formatNumber(derived?.bsa, 2)} unit="m²" />
        <Metric label="BMI" value={formatNumber(derived?.bmi, 1)} unit="kg/m²" />
        <Metric label="Target flow" value={formatNumber(derived?.targetFlow, 2)} unit="L/min" />
        <Metric label="Est. prime" value={formatNumber(derived?.prime, 0)} unit="mL" />
        <Metric label="Heparin load" value={formatNumber(derived?.heparin, 0)} unit="IU" />
        <Metric label="Predicted Hct" value={formatNumber(derived?.hctOnBypass, 1)} unit="%" />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">
        {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
