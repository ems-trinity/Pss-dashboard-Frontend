'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/auth';
import type { AuthUser } from '@/types';

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('trinity_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function useAuth() {
  const router = useRouter();
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace('/login'); return; }
    const stored = getStoredUser();
    if (!stored) { router.replace('/login'); return; }
    setUser(stored);
    setLoading(false);
  }, [router]);

  return { user, loading };
}
