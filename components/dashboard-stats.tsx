'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface Stats {
  totalEngineers: number;
  totalEquipment: number;
  totalWithdrawals: number;
  lowStockItems: number;
}

interface DashboardStatsProps {
  refreshKey?: number; // 👈 allows parent to trigger refresh
}

export function DashboardStats({ refreshKey }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalEngineers: 0,
    totalEquipment: 0,
    totalWithdrawals: 0,
    lowStockItems: 0,
  });

  const [loading, setLoading] = useState(true);

  // ✅ Safe JSON parser (prevents "<!DOCTYPE" crash)
  const fetchSafeJson = async (response: Response) => {
    if (!response.ok) return [];

    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Non-JSON response received');
      return [];
    }

    return response.json();
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      const [engResponse, equipResponse, withResponse] = await Promise.all([
        fetch('/api/site/engineers', { credentials: 'include' }),
        fetch('/api/site/equipment', { credentials: 'include' }),
        fetch('/api/site/withdrawals', { credentials: 'include' }),
      ]);

      const engineers = await fetchSafeJson(engResponse);
      const equipment = await fetchSafeJson(equipResponse);
      const withdrawals = await fetchSafeJson(withResponse);

      const lowStockItems = Array.isArray(equipment)
        ? equipment.filter((e: any) => e.quantity < 5).length
        : 0;

      setStats({
        totalEngineers: Array.isArray(engineers) ? engineers.length : 0,
        totalEquipment: Array.isArray(equipment) ? equipment.length : 0,
        totalWithdrawals: Array.isArray(withdrawals) ? withdrawals.length : 0,
        lowStockItems,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);

      setStats({
        totalEngineers: 0,
        totalEquipment: 0,
        totalWithdrawals: 0,
        lowStockItems: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Runs on first load AND whenever refreshKey changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Engineers',
      value: stats.totalEngineers,
      color: 'bg-blue-100 text-blue-800',
      icon: '👥',
    },
    {
      title: 'Equipment in Stock',
      value: stats.totalEquipment,
      color: 'bg-green-100 text-green-800',
      icon: '🔧',
    },
    {
      title: 'Total Withdrawals',
      value: stats.totalWithdrawals,
      color: 'bg-purple-100 text-purple-800',
      icon: '📦',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      color: 'bg-red-100 text-red-800',
      icon: '⚠️',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
              {stat.title}
              <span className="text-2xl">{stat.icon}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`inline-block px-4 py-2 rounded-lg ${stat.color}`}>
              <div className="text-4xl font-bold">{stat.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
