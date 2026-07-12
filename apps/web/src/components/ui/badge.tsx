import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

export function Badge({
  tone = 'default',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Map a case status to a badge tone for consistent status coloring. */
export function statusTone(status: string): Tone {
  switch (status) {
    case 'ON_BYPASS':
    case 'IN_OR':
    case 'WEANING':
      return 'warning';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'primary';
  }
}
