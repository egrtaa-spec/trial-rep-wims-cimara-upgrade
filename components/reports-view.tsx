'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { exportWithdrawalsByMultipleSites } from '@/lib/excel-export';
import { CIMARA_SITES } from '@/lib/constants';

interface Engineer {
  _id: string;
  siteName: string;
}

export function ReportsView() {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [siteName, setSiteName] = useState(CIMARA_SITES[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const sites = CIMARA_SITES; // Declare the sites variable

  useEffect(() => {
    fetchEngineers();
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

  const generateReport = async () => {
    if (!siteName) {
      toast({
        title: 'Error',
        description: 'Please select a site',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/reports?type=${reportType}&siteName=${siteName}&startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();
      setReports(data);

      toast({
        title: 'Success',
        description: 'Report generated successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reports.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      });
      return;
    }

    const data = reports.map((report: any) => ({
      Date: reportType === 'daily' ? report.reportDate : report.weekStartDate,
      Site: report.siteName,
      'Total Withdrawals': report.totalWithdrawals,
      ...(reportType === 'daily'
        ? { 'Equipment Used': report.equipmentUsed.map((e: any) => e.equipmentName).join(', ') }
        : {}),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}-report-${siteName}.xlsx`);

    toast({
      title: 'Success',
      description: 'Exported to Excel successfully',
    });
  };

  const exportToPDF = () => {
    if (reports.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add header with logo placeholder and title
    doc.setFontSize(16);
    doc.text('CIMARA - Equipment Withdrawal Report', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Quality brings reliability`, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Site: ${siteName}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Report Type: ${reportType.toUpperCase()}`, pageWidth / 2, 37, { align: 'center' });

    // Add table
    const tableData = reports.map((report: any) => [
      reportType === 'daily'
        ? new Date(report.reportDate).toLocaleDateString()
        : new Date(report.weekStartDate).toLocaleDateString(),
      report.siteName,
      report.totalWithdrawals.toString(),
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Site', 'Total Withdrawals']],
      body: tableData,
      startY: 45,
    });

    doc.save(`${reportType}-report-${siteName}.pdf`);

    toast({
      title: 'Success',
      description: 'Exported to PDF successfully',
    });
  };

  const exportToWord = () => {
    if (reports.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to export',
        variant: 'destructive',
      });
      return;
    }

    let htmlContent = `
      <h1>CIMARA - Equipment Withdrawal Report</h1>
      <p><strong>Quality brings reliability</strong></p>
      <p><strong>Site:</strong> ${siteName}</p>
      <p><strong>Report Type:</strong> ${reportType.toUpperCase()}</p>
      <table border="1" cellpadding="10">
        <thead>
          <tr>
            <th>Date</th>
            <th>Site</th>
            <th>Total Withdrawals</th>
          </tr>
        </thead>
        <tbody>
    `;

    reports.forEach((report: any) => {
      htmlContent += `
        <tr>
          <td>${
            reportType === 'daily'
              ? new Date(report.reportDate).toLocaleDateString()
              : new Date(report.weekStartDate).toLocaleDateString()
          }</td>
          <td>${report.siteName}</td>
          <td>${report.totalWithdrawals}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${siteName}.doc`;
    link.click();

    toast({
      title: 'Success',
      description: 'Exported to Word successfully',
    });
  };

  const exportAllSitesToExcel = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/withdrawals?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      );
      const withdrawals = await response.json();

      if (withdrawals.length === 0) {
        toast({
          title: 'Error',
          description: 'No withdrawal data available',
          variant: 'destructive',
        });
        return;
      }

      exportWithdrawalsByMultipleSites(withdrawals, startDate, endDate);

      toast({
        title: 'Success',
        description: 'Exported all sites to Excel successfully (5 sheets)',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Equipment Withdrawal Reports</CardTitle>
        <CardDescription>View and export daily or weekly reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Generation Section */}
        <div className="border-b pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Tabs
                value={reportType}
                onValueChange={(value) => setReportType(value as 'daily' | 'weekly')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Select Site</Label>
              <Select value={siteName} onValueChange={setSiteName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select site..." />
                </SelectTrigger>
                <SelectContent>
                  {CIMARA_SITES.map((site) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {reportType === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <Button onClick={generateReport} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <h3 className="font-semibold">Export Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Export Current Report:</p>
              {reports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button onClick={exportToExcel} variant="outline" className="w-full bg-transparent text-xs">
                    Excel
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" className="w-full bg-transparent text-xs">
                    PDF
                  </Button>
                  <Button onClick={exportToWord} variant="outline" className="w-full bg-transparent text-xs">
                    Word
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Generate a report first</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Export All 5 Sites (Excel):</p>
              <Button
                onClick={exportAllSitesToExcel}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground"
              >
                {loading ? 'Exporting...' : 'Multi-Site Report (5 Sheets)'}
              </Button>
              <p className="text-xs text-muted-foreground">Creates separate sheet for each site</p>
            </div>
          </div>
        </div>

        {/* Reports Display */}
        {reports.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Report Data</h3>
            {reports.map((report, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {reportType === 'daily'
                        ? new Date(report.reportDate).toLocaleDateString()
                        : `${new Date(report.weekStartDate).toLocaleDateString()} - ${new Date(report.weekEndDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Site</p>
                    <p className="font-semibold">{report.siteName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                    <p className="font-semibold text-lg text-primary">{report.totalWithdrawals}</p>
                  </div>
                </div>

                {reportType === 'daily' && report.equipmentUsed.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Equipment Used</p>
                    <div className="space-y-2">
                      {report.equipmentUsed.map((item: any, i: number) => (
                        <div key={i} className="text-sm bg-background p-2 rounded">
                          <p>
                            <strong>{item.equipmentName}</strong>: {item.quantityWithdrawn}{' '}
                            {item.unit}
                          </p>
                          {item.engineers.length > 0 && (
                            <p className="text-muted-foreground">
                              Used by: {item.engineers.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {reports.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Generate a report to view data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
