'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { DashboardStats } from '@/components/dashboard-stats';
import { LowStockAlerts } from '@/components/low-stock-alerts';
import { SiteEquipmentForm } from '@/components/site-equipment-form';
import { SiteEquipmentList } from '@/components/site-equipment-list';
import { SiteWithdrawalForm } from '@/components/site-withdrawal-form';
import { EngineerList } from '@/components/engineer-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <main className="min-h-screen bg-background">
      <Header compact={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-2 mb-6 text-xs lg:text-sm">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="engineers">Engineers</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
           <DashboardStats refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="engineers" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <EngineerList key={refreshKey} />
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <SiteEquipmentForm onSuccess={handleRefresh} />
            <SiteEquipmentList key={refreshKey} />
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <SiteWithdrawalForm onSuccess={handleRefresh} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </main>
  );
}
