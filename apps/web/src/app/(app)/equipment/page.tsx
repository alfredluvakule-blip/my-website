'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Paginated } from '@/lib/types';

interface EquipmentRow {
  id: string;
  category: string;
  manufacturer: string;
  model: string;
  lotNumber: string | null;
  expiryDate: string | null;
  quantityOnHand: number;
  isAvailable: boolean;
}

/** Equipment library with expiry awareness (expired items flagged red). */
export default function EquipmentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => api.get<Paginated<EquipmentRow>>('/equipment'),
  });

  const now = Date.now();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Equipment library</h1>
        <p className="text-muted-foreground">
          Oxygenators, cannulae, tubing packs and consumables with lot and expiry tracking.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data?.data.map((e) => {
          const expired = e.expiryDate ? new Date(e.expiryDate).getTime() < now : false;
          return (
            <Card key={e.id}>
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{e.model}</p>
                    <p className="text-sm text-muted-foreground">{e.manufacturer}</p>
                  </div>
                  <Badge tone="primary">{e.category.replace('_', ' ')}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Qty {e.quantityOnHand}</span>
                  {e.lotNumber && <span>Lot {e.lotNumber}</span>}
                  {e.expiryDate && (
                    <Badge tone={expired ? 'danger' : 'success'}>
                      {expired ? 'Expired' : 'Expires'} {new Date(e.expiryDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {data && data.data.length === 0 && (
          <p className="text-muted-foreground">No equipment recorded yet.</p>
        )}
      </div>
    </div>
  );
}
