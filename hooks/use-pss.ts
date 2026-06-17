'use client';
import { useState, useEffect, useCallback } from 'react';
import { getPss } from '@/lib/api';
import type { Pss } from '@/types';

export function usePss() {
  const [pss,     setPss]     = useState<Pss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getPss();
      setPss(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PSS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return { pss, loading, error, refresh: load };
}
