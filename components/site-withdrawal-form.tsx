'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Equipment { _id: string; name: string; quantity: number; unit: string; }

export function SiteWithdrawalForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [current, setCurrent] = useState({ equipmentId: '', quantityWithdrawn: 0, equipmentName: '', unit: '' });

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/site/equipment', {
        credentials: 'include',
      });
      const data = await res.json().catch(() => []);
      setEquipment(Array.isArray(data) ? data : []);
    })();
  }, []);

  const onEquip = (id: string) => {
    const eq = equipment.find(e => e._id === id);
    if (!eq) return;
    setCurrent({ equipmentId: id, quantityWithdrawn: 0, equipmentName: eq.name, unit: eq.unit });
  };

  const addItem = () => {
    if (!current.equipmentId || current.quantityWithdrawn <= 0) {
      toast({ title: 'Error', description: 'Select equipment and quantity', variant: 'destructive' });
      return;
    }
    const eq = equipment.find(e => e._id === current.equipmentId);
    if (!eq || current.quantityWithdrawn > eq.quantity) {
      toast({ title: 'Error', description: 'Insufficient stock', variant: 'destructive' });
      return;
    }
    setItems(prev => [...prev, { ...current }]);
    setCurrent({ equipmentId: '', quantityWithdrawn: 0, equipmentName: '', unit: '' });
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/site/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ withdrawalDate, description, items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast({ title: 'Success', description: 'Withdrawal recorded' });
      setItems([]);
      setDescription('');
      onSuccess?.();
    } catch {
      toast({ title: 'Error', description: 'Failed to record withdrawal', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Equipment Withdrawal</CardTitle>
        <CardDescription>Engineer name is recorded automatically. “Receiver” is now Description.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Withdrawal Date</Label>
              <Input type="date" value={withdrawalDate} onChange={(e)=>setWithdrawalDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Where/why it was used" />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Add Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select value={current.equipmentId} onValueChange={onEquip}>
                  <SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                  <SelectContent>
                    {equipment.map(eq => (
                      <SelectItem key={eq._id} value={eq._id}>
                        {eq.name} (Available: {eq.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={current.quantityWithdrawn || ''} onChange={(e)=>setCurrent({...current, quantityWithdrawn: Number(e.target.value)})} />
              </div>

              <div className="space-y-2 flex items-end">
                <Button type="button" onClick={addItem} variant="outline" className="w-full bg-transparent">Add Item</Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-background p-2 rounded">
                    <div>
                      <p className="font-medium">{it.equipmentName}</p>
                      <p className="text-sm text-muted-foreground">{it.quantityWithdrawn} {it.unit}</p>
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(idx)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading || items.length === 0} className="w-full">
            {loading ? 'Processing...' : 'Record Withdrawal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
