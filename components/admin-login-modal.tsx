'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';

export function AdminLoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void; }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid admin credentials');
        return;
      }

      onOpenChange(false);
      window.location.href = '/admin/dashboard';
    } catch {
      setError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2"><Shield className="h-5 w-5" /> Admin Login</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Admin Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} required />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Admin Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login as Admin'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
