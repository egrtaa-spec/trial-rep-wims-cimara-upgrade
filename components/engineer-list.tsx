'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EngineerList() {
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/engineers', {
          credentials: 'include',
        });
        const data = await res.json();
        setEngineers(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engineers (Your Site)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? 'Loading...' : (
          <div className="space-y-2">
            {engineers.length === 0 && <p className="text-sm text-muted-foreground">No engineers found.</p>}
            {engineers.map((e) => (
              <div key={e._id} className="border rounded p-3">
                <p className="font-semibold">{e.name}</p>
                <p className="text-sm text-muted-foreground">Username: {e.username}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
