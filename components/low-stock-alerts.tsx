'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface Equipment {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('/api/equipment', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!response.ok || !Array.isArray(data)) {
        console.error('Invalid response from equipment API:', data);
        setLowStockItems([]);
        return;
      }
      
      const lowStock = data.filter((e: Equipment) => e.quantity < 5);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      setLowStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <Card className="w-full bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Stock Status</CardTitle>
          <CardDescription>All items have sufficient stock</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>{lowStockItems.length} items below minimum threshold</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowStockItems.map((item) => (
          <Alert key={item._id} className="bg-white border-yellow-300">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              {item.name}
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Current stock: <span className="font-semibold">{item.quantity} {item.unit}</span>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
