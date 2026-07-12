'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { HeartPulse } from 'lucide-react';

/** Secure email/password login backed by Supabase Auth. */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    setError(null);
    if (!email) return setError('Enter your email first, then choose “Forgot password”.');
    try {
      await getSupabase().auth.resetPasswordForEmail(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <HeartPulse className="size-8" />
          </div>
          <CardTitle className="text-2xl">Perfusio</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cardiopulmonary Bypass Perfusion Record
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            {resetSent && (
              <p className="text-sm text-success">Password reset email sent — check your inbox.</p>
            )}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
