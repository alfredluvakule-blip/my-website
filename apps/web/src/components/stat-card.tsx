import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Compact metric tile for the dashboard. Large value, quiet label. */
export function StatCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: 'primary' | 'warning' | 'success' | 'danger';
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1 text-3xl font-semibold tabular-nums',
            tone === 'warning' && 'text-warning',
            tone === 'success' && 'text-success',
            tone === 'danger' && 'text-danger',
            tone === 'primary' && 'text-primary',
          )}
        >
          {value}
          {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
