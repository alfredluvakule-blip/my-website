'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCases } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, statusTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUSES = ['ALL', 'SCHEDULED', 'IN_OR', 'ON_BYPASS', 'COMPLETED', 'CANCELLED'] as const;

export default function CasesPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('ALL');
  const { data, isLoading } = useCases(status === 'ALL' ? undefined : status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Cases</h1>
        <p className="text-muted-foreground">Scheduled, running and completed pump runs.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? 'primary' : 'outline'}
            onClick={() => setStatus(s)}
          >
            {s.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data?.data.map((c) => (
          <Link key={c.id} href={`/cases/${c.id}`}>
            <Card className="h-full transition hover:border-primary hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.procedure}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.patient?.name} · {c.patient?.hospitalNumber}
                    </p>
                  </div>
                  <Badge tone={statusTone(c.status)}>{c.status.replace('_', ' ')}</Badge>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{c.operatingRoom ?? 'OR —'}</span>
                  <span>{new Date(c.scheduledDate).toLocaleDateString()}</span>
                  {c.cpbTimeMin != null && <span>CPB {c.cpbTimeMin} min</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {data && data.data.length === 0 && (
          <p className="text-muted-foreground">No cases in this view.</p>
        )}
      </div>
    </div>
  );
}
