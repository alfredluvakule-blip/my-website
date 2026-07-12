'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboard, useCasesByMonth } from '@/lib/hooks';
import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const byMonth = useCasesByMonth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Live theatre activity and perfusion statistics.</p>
      </div>

      {isError && (
        <Card>
          <CardContent className="p-5 text-danger">
            Could not load dashboard. Check that the API is running and you are signed in.
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's cases" value={isLoading ? '—' : data?.cases.today ?? 0} tone="primary" />
        <StatCard label="Running now" value={isLoading ? '—' : data?.cases.running ?? 0} tone="warning" />
        <StatCard label="Completed" value={isLoading ? '—' : data?.cases.completed ?? 0} tone="success" />
        <StatCard label="Cancelled" value={isLoading ? '—' : data?.cases.cancelled ?? 0} tone="danger" />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Avg CPB time" value={formatNumber(data?.perfusion.avgCpbTimeMin, 0)} unit="min" />
        <StatCard
          label="Avg cross-clamp"
          value={formatNumber(data?.perfusion.avgCrossClampTimeMin, 0)}
          unit="min"
        />
        <StatCard label="Avg ACT" value={formatNumber(data?.perfusion.avgAct, 0)} unit="s" />
        <StatCard label="Avg temp" value={formatNumber(data?.perfusion.avgTemperatureC, 1)} unit="°C" />
        <StatCard label="Avg flow" value={formatNumber(data?.perfusion.avgFlowLmin, 2)} unit="L/min" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pump cases by month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
