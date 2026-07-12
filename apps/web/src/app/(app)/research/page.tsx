'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ShieldCheck } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Research export. Downloads an anonymized, completed-case dataset. Patient
 * identifiers are stripped server-side; the file carries only pseudonymous
 * subject ids and banded ages.
 */
export default function ResearchPage() {
  const [busy, setBusy] = useState<string | null>(null);

  async function download(format: 'csv' | 'json') {
    setBusy(format);
    try {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      const res = await fetch(`${BASE}/research/dataset?format=${format}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `perfusio-research.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Research export</h1>
        <p className="text-muted-foreground">
          De-identified datasets for analysis in SPSS, Stata, R, Python or Excel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-success" /> Anonymized dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Names, hospital numbers, dates of birth and free-text notes are removed. Each subject
            gets a stable pseudonymous id within the export, and ages are banded into decades.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => download('csv')} disabled={busy !== null}>
              <Download className="size-4" /> {busy === 'csv' ? 'Preparing…' : 'Download CSV'}
            </Button>
            <Button variant="outline" onClick={() => download('json')} disabled={busy !== null}>
              <Download className="size-4" /> {busy === 'json' ? 'Preparing…' : 'Download JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
