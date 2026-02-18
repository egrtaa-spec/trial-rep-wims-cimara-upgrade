'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface Stats {
  totalEngineers: number;
  totalEquipment: number;
  totalWithdrawals: number;
  lowStockItems: number;
}

interface DashboardStatsProps {
  refreshKey?: number;
}

export function DashboardStats({ refreshKey }: DashboardStatsProps) {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    totalEngineers: 0,
    totalEquipment: 0,
    totalWithdrawals: 0,
    lowStockItems: 0,
  });

  const [loading, setLoading] = useState(true);

  /**
   * Safe JSON fetcher
   * - Prevents "<!DOCTYPE" crash
   * - Handles 401 properly
   */
  const fetchJsonSafe = async (url: string, p0: { catch: string; }) => {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      // 🚨 If unauthorized → redirect to login
      if (response.status === 401) {
        router.replace('/login');
        return [];
      }

      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType?.includes('application/json')) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return [];
    }
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);

    try {
      const [engineers, equipment, withdrawals] = await Promise.all([
        fetchJsonSafe('/api/site/engineers', {catch: 'no-store'}),
        fetchJsonSafe('/api/site/equipment', {catch: 'no-store'}),
        fetchJsonSafe('/api/site/withdrawals', {catch: 'no-store'}),
      ]);

      const safeEngineers = Array.isArray(engineers) ? engineers : [];
      const safeEquipment = Array.isArray(equipment) ? equipment : [];
      const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];

      const lowStockItems = safeEquipment.filter(
        (item: any) => Number(item.quantity) < 5
      ).length;

      setStats({
        totalEngineers: safeEngineers.length,
        totalEquipment: safeEquipment.length,
        totalWithdrawals: safeWithdrawals.length,
        lowStockItems,
      });
    } catch (error) {
      console.error('Stats fetch failed:', error);
      setStats({
        totalEngineers: 0,
        totalEquipment: 0,
        totalWithdrawals: 0,
        lowStockItems: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Runs on mount and refreshKey change
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const cards = [
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-sm hover:shadow-md transition">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {card.title}
              <span className="text-2xl">{card.icon}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`inline-block px-4 py-2 rounded-lg ${card.color}`}
            >
              <div className="text-4xl font-bold">{card.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}