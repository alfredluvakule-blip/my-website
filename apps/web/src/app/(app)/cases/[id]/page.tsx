'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PerfusionTimeline, type TimelineItem } from '@/components/perfusion-timeline';
import { MonitoringEntryForm } from '@/components/monitoring-entry-form';

interface CaseDetail {
  id: string;
  procedure: string;
  status: string;
  operatingRoom: string | null;
  cpbTimeMin: number | null;
  crossClampTimeMin: number | null;
  targetFlowLmin: string | null;
  patient: { name: string; hospitalNumber: string; bsaM2: string | null };
  timeline: TimelineItem[];
}

interface MonitoringRow {
  id: string;
  recordedAt: string;
  pumpFlowLmin: string | null;
  nasopharyngealTempC: string | null;
  map: string | null;
  hematocrit: string | null;
  act: number | null;
  do2i: string | null;
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const caseQuery = useQuery({
    queryKey: ['case', id],
    queryFn: () => api.get<{ data: CaseDetail }>(`/cases/${id}`),
    select: (r) => r.data,
  });

  const monitoringQuery = useQuery({
    queryKey: ['monitoring', id],
    queryFn: () => api.get<{ data: MonitoringRow[] }>(`/cases/${id}/monitoring`),
    select: (r) => r.data,
    // Live theatre view: poll while the case screen is open.
    refetchInterval: 15_000,
  });

  const addRecord = useMutation({
    mutationFn: (payload: unknown) => api.post(`/cases/${id}/monitoring`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitoring', id] });
    },
  });

  const c = caseQuery.data;
  const records = monitoringQuery.data ?? [];
  const chartData = records.map((r) => ({
    t: new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    flow: r.pumpFlowLmin ? Number(r.pumpFlowLmin) : null,
    temp: r.nasopharyngealTempC ? Number(r.nasopharyngealTempC) : null,
    map: r.map ? Number(r.map) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      {c && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{c.procedure}</h1>
            <p className="text-muted-foreground">
              {c.patient.name} · {c.patient.hospitalNumber} · {c.operatingRoom ?? 'OR —'}
            </p>
          </div>
          <Badge tone={statusTone(c.status)}>{c.status.replace('_', ' ')}</Badge>
        </div>
      )}

      {/* Live monitoring cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <LiveCard label="CPB time" value={c?.cpbTimeMin != null ? `${c.cpbTimeMin}` : '—'} unit="min" />
        <LiveCard
          label="Cross-clamp"
          value={c?.crossClampTimeMin != null ? `${c.crossClampTimeMin}` : '—'}
          unit="min"
        />
        <LiveCard label="Target flow" value={c?.targetFlowLmin ?? '—'} unit="L/min" />
        <LiveCard label="Records" value={`${records.length}`} unit="entries" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Perfusion trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                    }}
                  />
                  <Line type="monotone" dataKey="flow" name="Flow (L/min)" stroke="hsl(var(--primary))" dot={false} />
                  <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="hsl(var(--warning))" dot={false} />
                  <Line type="monotone" dataKey="map" name="MAP (mmHg)" stroke="hsl(var(--success))" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Bypass timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PerfusionTimeline items={c?.timeline ?? []} />
          </CardContent>
        </Card>
      </div>

      <MonitoringEntryForm
        bsaM2={c?.patient.bsaM2 ? Number(c.patient.bsaM2) : undefined}
        submitting={addRecord.isPending}
        onSubmit={(payload) => addRecord.mutate(payload)}
      />

      {/* Recent records table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Flow</th>
                  <th className="px-4 py-3 font-medium">Temp</th>
                  <th className="px-4 py-3 font-medium">MAP</th>
                  <th className="px-4 py-3 font-medium">Hct</th>
                  <th className="px-4 py-3 font-medium">ACT</th>
                  <th className="px-4 py-3 font-medium">DO2i</th>
                </tr>
              </thead>
              <tbody>
                {records
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono tabular-nums">
                        {new Date(r.recordedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{r.pumpFlowLmin ?? '—'}</td>
                      <td className="px-4 py-2 tabular-nums">{r.nasopharyngealTempC ?? '—'}</td>
                      <td className="px-4 py-2 tabular-nums">{r.map ?? '—'}</td>
                      <td className="px-4 py-2 tabular-nums">{r.hematocrit ?? '—'}</td>
                      <td className="px-4 py-2 tabular-nums">{r.act ?? '—'}</td>
                      <td className="px-4 py-2 tabular-nums">{r.do2i ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}
