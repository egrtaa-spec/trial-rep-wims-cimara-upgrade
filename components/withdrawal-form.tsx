'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CIMARA_SITES } from '@/lib/constants';

interface Engineer {
  _id: string;
  name: string;
  siteName: string;
}

interface Equipment {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface WithdrawalItem {
  equipmentId: string;
  equipmentName: string;
  quantityWithdrawn: number;
  unit: string;
}

interface WithdrawalFormProps {
  onSuccess?: () => void;
}

export function WithdrawalForm({ onSuccess }: WithdrawalFormProps) {
  const [loading, setLoading] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    engineerId: '',
    engineerName: '',
    siteName: '',
    withdrawalDate: new Date().toISOString().split('T')[0],
    receiverName: '',
    senderName: '',
    notes: '',
  });

  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    equipmentId: '',
    equipmentName: '',
    quantityWithdrawn: 0,
    unit: '',
  });

  useEffect(() => {
    fetchEngineers();
    fetchEquipment();
  }, []);

  const fetchEngineers = async () => {
    try {
      const response = await fetch('/api/engineers', {
        credentials: 'include',
      });
      const data = await response.json();
      setEngineers(data);
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment', {
        credentials: 'include',
      });
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleEngineerChange = (engineerId: string) => {
    const engineer = engineers.find((e) => e._id === engineerId);
    if (engineer) {
      setFormData({
        ...formData,
        engineerId,
        engineerName: engineer.name,
        siteName: engineer.siteName,
      });
    }
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const equip = equipment.find((e) => e._id === equipmentId);
    if (equip) {
      setCurrentItem({
        ...currentItem,
        equipmentId,
        equipmentName: equip.name,
        unit: equip.unit,
      });
    }
  };

  const addItem = () => {
    if (
      !currentItem.equipmentId ||
      currentItem.quantityWithdrawn <= 0
    ) {
      toast({
        title: 'Error',
        description: 'Please select equipment and enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    const equip = equipment.find((e) => e._id === currentItem.equipmentId);
    if (!equip || currentItem.quantityWithdrawn > equip.quantity) {
      toast({
        title: 'Error',
        description: 'Insufficient quantity available',
        variant: 'destructive',
      });
      return;
    }

    setItems([...items, { ...currentItem }]);
    setCurrentItem({
      equipmentId: '',
      equipmentName: '',
      quantityWithdrawn: 0,
      unit: '',
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.engineerId || items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select an engineer and add at least one item',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (!response.ok) throw new Error('Failed to create withdrawal');

      toast({
        title: 'Success',
        description: 'Withdrawal recorded successfully',
      });

      setFormData({
        engineerId: '',
        engineerName: '',
        siteName: '',
        withdrawalDate: new Date().toISOString().split('T')[0],
        receiverName: '',
        senderName: '',
        notes: '',
      });
      setItems([]);

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Equipment Withdrawal</CardTitle>
        <CardDescription>Record equipment being withdrawn from warehouse</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="engineer">Select Engineer</Label>
              <Select value={formData.engineerId} onValueChange={handleEngineerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select engineer..." />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map((eng) => (
                    <SelectItem key={eng._id} value={eng._id}>
                      {eng.name} - {eng.siteName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalDate">Withdrawal Date</Label>
              <Input
                id="withdrawalDate"
                name="withdrawalDate"
                type="date"
                value={formData.withdrawalDate}
                onChange={(e) =>
                  setFormData({ ...formData, withdrawalDate: e.target.value })
                }
                required
              />
            </div>

            {formData.siteName && (
              <div className="space-y-2 md:col-span-2 bg-secondary/20 p-3 rounded-md">
                <p className="text-sm font-semibold">
                  Site: <span className="text-primary">{formData.siteName}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="receiverName">Receiver's Name</Label>
              <Input
                id="receiverName"
                name="receiverName"
                value={formData.receiverName}
                onChange={(e) =>
                  setFormData({ ...formData, receiverName: e.target.value })
                }
                placeholder="Name of person receiving materials"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderName">Sender's Name</Label>
              <Input
                id="senderName"
                name="senderName"
                value={formData.senderName}
                onChange={(e) =>
                  setFormData({ ...formData, senderName: e.target.value })
                }
                placeholder="Name of person sending materials"
                required
              />
            </div>
          </div>

          {/* Add Items Section */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Add Items to Withdrawal</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment</Label>
                <Select value={currentItem.equipmentId} onValueChange={handleEquipmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((equip) => (
                      <SelectItem key={equip._id} value={equip._id}>
                        {equip.name} (Available: {equip.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity to Withdraw</Label>
                <Input
                  id="quantity"
                  inputMode="numeric"
                  value={currentItem.quantityWithdrawn || ''}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      quantityWithdrawn: e.target.value === '' ? 0 : Number(e.target.value),
                    })
                  }
                  placeholder="Enter quantity manually"
                />
              </div>

              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  Add Item
                </Button>
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <h4 className="font-semibold">Items to Withdraw</h4>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-background p-2 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.equipmentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantityWithdrawn} {item.unit}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this withdrawal..."
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              rows={2}
            />
          </div>

          <Button type="submit" disabled={loading || items.length === 0} className="w-full">
            {loading ? 'Processing...' : 'Record Withdrawal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
