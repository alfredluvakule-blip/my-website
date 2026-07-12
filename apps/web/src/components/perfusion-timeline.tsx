'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Human labels for canonical timeline events. */
const EVENT_LABELS: Record<string, string> = {
  PATIENT_IN_OR: 'Patient in OR',
  ANESTHESIA_START: 'Anaesthesia start',
  INCISION: 'Incision',
  HEPARIN_GIVEN: 'Heparin given',
  ACT_MEASURED: 'ACT measured',
  CANNULATION: 'Cannulation',
  CPB_START: 'CPB started',
  CROSS_CLAMP_ON: 'Cross-clamp applied',
  CARDIOPLEGIA_GIVEN: 'Cardioplegia',
  CROSS_CLAMP_OFF: 'Cross-clamp removed',
  WEANING_START: 'Weaning started',
  CPB_END: 'CPB end',
  DECANNULATION: 'Decannulation',
  PROTAMINE_GIVEN: 'Protamine',
  CASE_COMPLETED: 'Case completed',
  CUSTOM: 'Event',
};

export interface TimelineItem {
  id: string;
  event: string;
  occurredAt: string;
  label?: string | null;
  detail?: string | null;
}

/** Vertical bypass timeline, ordered by time, with the OR clinical accent. */
export function PerfusionTimeline({ items }: { items: TimelineItem[] }) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No timeline events yet.</p>;
  }
  return (
    <ol className="relative ml-3 border-l-2 border-border">
      {sorted.map((item, i) => {
        const critical = item.event === 'CPB_START' || item.event === 'CROSS_CLAMP_ON';
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="mb-5 ml-5"
          >
            <span
              className={cn(
                'absolute -left-[9px] flex size-4 items-center justify-center rounded-full ring-4 ring-background',
                critical ? 'bg-primary' : 'bg-muted-foreground',
              )}
            />
            <time className="font-mono text-sm tabular-nums text-muted-foreground">
              {new Date(item.occurredAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
            <p className="font-medium">{item.label ?? EVENT_LABELS[item.event] ?? item.event}</p>
            {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
          </motion.li>
        );
      })}
    </ol>
  );
}
