'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePatients } from '@/lib/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';

export default function PatientsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = usePatients(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">Registered patients with derived BSA and BMI.</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="size-4" /> Register patient
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, hospital number, diagnosis…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Hospital No.</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Sex</th>
                  <th className="px-4 py-3 font-medium">BSA</th>
                  <th className="px-4 py-3 font-medium">BMI</th>
                  <th className="px-4 py-3 font-medium">Blood</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {data?.data.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono">{p.hospitalNumber}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/patients/${p.id}`} className="text-primary hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.age ?? '—'}</td>
                    <td className="px-4 py-3">{p.sex}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(Number(p.bsaM2), 2)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(Number(p.bmi), 1)}</td>
                    <td className="px-4 py-3">
                      <Badge tone="primary">{p.bloodGroup.replace('_', ' ')}</Badge>
                    </td>
                  </tr>
                ))}
                {data && data.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
