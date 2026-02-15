'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('[v0] Checking session...');
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const data = await response.json();
      console.log('[v0] Session check result:', data);
      setUser(data.user || null);
    } catch (err) {
      console.error('[v0] Session check error:', err);
      setError('Failed to check session');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout...');
      setLoading(true);
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
      });

      console.log('Logout response status:', response.status);

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Logout response:', data);

      // Clear user state immediately
      setUser(null);
      setError(null);
      
      // Small delay to ensure cookie is deleted
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Redirecting to /login');
      // Use router.push for client-side navigation
      router.push('/login');
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Logout failed';
      console.error('Logout error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      return false;
    }
  };

  return { user, loading, error, logout, checkSession };
}
