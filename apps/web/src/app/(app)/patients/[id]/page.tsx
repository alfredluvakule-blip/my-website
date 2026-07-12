'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import type { PatientRow } from '@/lib/types';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get<{ data: PatientRow }>(`/patients/${id}`),
    select: (r) => r.data,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-danger">Patient not found.</p>;

  const facts: Array<[string, string]> = [
    ['Hospital number', data.hospitalNumber],
    ['Age', data.age != null ? `${data.age} yr` : '—'],
    ['Sex', data.sex],
    ['Weight', `${formatNumber(Number(data.weightKg), 1)} kg`],
    ['Height', `${formatNumber(Number(data.heightCm), 1)} cm`],
    ['BSA', `${formatNumber(Number(data.bsaM2), 2)} m²`],
    ['BMI', `${formatNumber(Number(data.bmi), 1)} kg/m²`],
    ['Blood group', data.bloodGroup.replace('_', ' ')],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        <Badge tone="primary">{data.bloodGroup.replace('_', ' ')}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {facts.map(([k, val]) => (
            <div key={k}>
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-lg font-medium tabular-nums">{val}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {data.diagnosis && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{data.diagnosis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
