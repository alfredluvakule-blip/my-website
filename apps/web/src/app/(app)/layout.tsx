'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { AppShell } from '@/components/app-shell';

/**
 * Authenticated layout guard. Redirects to /login when there is no Supabase
 * session. Server-side RLS + the API's JWT check are the real enforcement; this
 * is a UX guard only.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        if (!data.session) router.replace('/login');
        else setReady(true);
      })
      .catch(() => router.replace('/login'));
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
