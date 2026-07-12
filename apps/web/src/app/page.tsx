'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

/** Entry redirect: authenticated → dashboard, otherwise → login. */
export default function IndexPage() {
  const router = useRouter();
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => router.replace(data.session ? '/dashboard' : '/login'))
      .catch(() => router.replace('/login'));
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading Perfusio…
    </div>
  );
}
