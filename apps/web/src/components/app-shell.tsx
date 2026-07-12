'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Activity,
  Boxes,
  FlaskConical,
  Moon,
  Sun,
  Hand,
  LogOut,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/store';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/cases', label: 'Cases', icon: Activity },
  { href: '/equipment', label: 'Equipment', icon: Boxes },
  { href: '/research', label: 'Research', icon: FlaskConical },
] as const;

/** Persistent sidebar shell for the authenticated app. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { touchMode, toggleTouchMode } = useUiStore();

  async function signOut() {
    await getSupabase().auth.signOut();
    router.push('/login');
  }

  return (
    <div className={cn('flex min-h-screen', touchMode && 'touch-mode')}>
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2 px-5 py-4">
          <HeartPulse className="size-6 text-primary" />
          <span className="text-lg font-semibold">Perfusio</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 border-t p-3">
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button
            variant={touchMode ? 'primary' : 'ghost'}
            size="sm"
            onClick={toggleTouchMode}
            title="Enlarge controls for OR touchscreens"
          >
            <Hand className="size-4" />
            OR touch mode
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
