'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SiteEquipmentList() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/site/equipment', {
        credentials: 'include',
      });
      const data = await res.json().catch(() => []);
      setEquipment(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Site Equipment</CardTitle></CardHeader>
      <CardContent>
        {loading ? 'Loading...' : (
          <div className="space-y-2">
            {equipment.length === 0 && <p className="text-sm text-muted-foreground">No equipment yet.</p>}
            {equipment.map((e) => (
              <div key={e._id} className="border rounded p-3 flex justify-between">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-sm text-muted-foreground">{e.quantity} {e.unit} • {e.location}</p>
                </div>
                <div className="text-sm text-muted-foreground">{e.category}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
