'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface WithdrawalItem {
  equipmentId: string;
  equipmentName: string;
  quantityWithdrawn: number;
  unit: string;
  reason?: string;
}

interface Withdrawal {
  _id: string;
  withdrawalDate: string;
  engineerId: string;
  engineerName: string;
  siteName: string;
  receiverName: string;
  senderName: string;
  receiptNumber: string;
  items: WithdrawalItem[];
  notes?: string;
  status: string;
}

export function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdrawals', {
        credentials: 'include',
      });
      const data = await response.json();
      setWithdrawals(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReceipt = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowReceipt(true);
  };

  const downloadReceipt = () => {
    if (!selectedWithdrawal) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .receipt {
            background: white;
            border: 2px solid #7B2CBF;
            padding: 20px;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #7B2CBF;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #7B2CBF;
          }
          .tagline {
            font-size: 12px;
            color: #FFD60A;
            margin-top: 5px;
          }
          .details {
            margin: 15px 0;
            font-size: 14px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .items-table {
            width: 100%;
            margin: 15px 0;
            border-collapse: collapse;
          }
          .items-table th {
            background: #7B2CBF;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 12px;
          }
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 12px;
          }
          .total-section {
            margin-top: 15px;
            border-top: 2px solid #7B2CBF;
            padding-top: 10px;
            text-align: right;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #f0f0f0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">CIMARA</div>
            <div class="tagline">Quality brings reliability</div>
          </div>

          <div class="details">
            <div class="details-row">
              <span><strong>Date:</strong></span>
              <span>${new Date(selectedWithdrawal.withdrawalDate).toLocaleDateString()}</span>
            </div>
            <div class="details-row">
              <span><strong>Engineer:</strong></span>
              <span>${selectedWithdrawal.engineerName}</span>
            </div>
            <div class="details-row">
              <span><strong>Site:</strong></span>
              <span>${selectedWithdrawal.siteName}</span>
            </div>
            <div class="details-row">
              <span><strong>Receipt #:</strong></span>
              <span>${selectedWithdrawal._id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              ${selectedWithdrawal.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.equipmentName}</td>
                  <td>${item.quantityWithdrawn}</td>
                  <td>${item.unit}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="total-section">
            <strong>Total Items Withdrawn: ${selectedWithdrawal.items.length}</strong>
          </div>

          ${
            selectedWithdrawal.notes
              ? `
            <div class="details">
              <strong>Notes:</strong>
              <p>${selectedWithdrawal.notes}</p>
            </div>
          `
              : ''
          }

          <div class="footer">
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>This is an official receipt from CIMARA Ltd.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
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

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            View all equipment withdrawals and receipts ({withdrawals.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal._id}>
                    <TableCell className="font-medium">
                      {new Date(withdrawal.withdrawalDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{withdrawal.engineerName}</TableCell>
                    <TableCell className="text-sm">{withdrawal.siteName}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {withdrawal.items.length}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          withdrawal.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReceipt(withdrawal)}
                      >
                        View Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {withdrawals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No withdrawals recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Receipt</DialogTitle>
            <DialogDescription>
              Receipt for equipment withdrawal by {selectedWithdrawal?.engineerName}
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="bg-card border-2 border-primary rounded-lg p-8 space-y-4">
              {/* Header with Logo */}
              <div className="text-center border-b-2 border-primary pb-4 space-y-2">
                <div className="flex justify-center mb-3">
                  <Image
                    src="/logo.png"
                    alt="CIMARA Logo"
                    width={50}
                    height={50}
                    className="object-contain"
                  />
                </div>
                <h2 className="text-2xl font-bold text-primary">CIMARA</h2>
                <p className="text-sm text-secondary-foreground">Quality brings reliability</p>
              </div>

              {/* Receipt Details */}
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedWithdrawal.withdrawalDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Receipt #</p>
                    <p className="font-semibold">{selectedWithdrawal._id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engineer</p>
                    <p className="font-semibold">{selectedWithdrawal.engineerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Site</p>
                    <p className="font-semibold">{selectedWithdrawal.siteName}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Equipment Name</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWithdrawal.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{item.equipmentName}</td>
                        <td className="px-4 py-2 text-right">{item.quantityWithdrawn}</td>
                        <td className="px-4 py-2 text-right">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-secondary/20 p-4 rounded-lg text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Total Items Withdrawn:</span>
                  <span className="text-primary">{selectedWithdrawal.items.length}</span>
                </div>
              </div>

              {selectedWithdrawal.notes && (
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p className="font-semibold mb-1">Notes:</p>
                  <p>{selectedWithdrawal.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground border-t pt-3">
                <p>Generated: {new Date().toLocaleString()}</p>
                <p className="mt-1">This is an official receipt from CIMARA Ltd.</p>
              </div>

              {/* Print Button */}
              <Button onClick={downloadReceipt} className="w-full">
                Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
