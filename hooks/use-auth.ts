'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, decodeJwtPayload, getInitials } from '@/lib/auth';
import type { AuthUser } from '@/types';

export function useAuth() {
  const router = useRouter();
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace('/login'); return; }
    const payload = decodeJwtPayload(token);
    if (!payload) { router.replace('/login'); return; }
    setUser({
      id:       payload.id as string,
      name:     payload.name as string,
      email:    payload.email as string,
      role:     payload.role as AuthUser['role'],
      initials: getInitials((payload.name as string) ?? 'U'),
    });
    setLoading(false);
  }, [router]);

  return { user, loading };
}
