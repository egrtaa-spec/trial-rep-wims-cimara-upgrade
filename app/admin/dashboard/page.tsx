'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { DashboardStats } from '@/components/dashboard-stats';
import { AdminLowStockAlerts } from '@/components/admin-low-stock-alert';
import { EngineerRegistrationForm } from '@/components/engineer-registration-form';
import { AdminEquipmentForm } from '@/components/admin-equipment-form';
import { AdminEquipmentList } from '@/components/admin-equipment-list';
import { AdminWarehouseWithdrawalForm } from '@/components/admin-warehouse-withdrawal-form';
import { AdminWithdrawalHistory } from '@/components/admin-withdrawal-history';
import { AdminReportsView } from '@/components/admin-reports-review';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

export default function AdminDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <main className="min-h-screen bg-background">
      <Header showAdminButton={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 gap-2 mb-6 text-xs lg:text-sm">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="engineers">Engineers</TabsTrigger>
            <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
            <TabsTrigger value="withdrawals">Dispatch</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats />
            <AdminLowStockAlerts />
          </TabsContent>

          <TabsContent value="engineers" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <EngineerRegistrationForm onSuccess={handleRefresh} />
          </TabsContent>

          <TabsContent value="warehouse" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <AdminEquipmentForm onSuccess={handleRefresh} />
            <AdminEquipmentList key={refreshKey} />
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <AdminWarehouseWithdrawalForm onSuccess={handleRefresh} />
          </TabsContent>

          <TabsContent value="receipts" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleRefresh} variant="outline">Refresh</Button>
            </div>
            <AdminWithdrawalHistory key={refreshKey} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AdminReportsView />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </main>
  );
}
