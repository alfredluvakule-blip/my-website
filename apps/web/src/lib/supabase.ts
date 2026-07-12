'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser Supabase client. Used for Auth (login, session, password reset) and
 * for read-only Realtime subscriptions to live case data. All clinical writes
 * go through the Express API, never directly here.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Supabase env vars are not configured (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)');
  }
  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
