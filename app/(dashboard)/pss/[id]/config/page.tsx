'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ThresholdConfig } from '@/components/config/threshold-config';
import { usePss } from '@/hooks/use-pss';
import { getThresholds, DEFAULT_THRESHOLDS } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import type { Thresholds } from '@/types';

export default function ConfigPage() {
  const { id }   = useParams<{ id: string }>();
  const { pss }  = usePss();
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState<Thresholds>({
    global:  DEFAULT_THRESHOLDS,
    perUnit: {},
  });

  useEffect(() => {
    if (id) {
      getThresholds(id).then(setThresholds).catch(console.error);
    }
  }, [id]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="p-6 text-sm text-[#6B7280]">
        Threshold configuration requires Super Admin role.
      </div>
    );
  }

  async function handleSave(t: Thresholds) {
    setThresholds(t);
  }

  return <ThresholdConfig pss={pss} thresholds={thresholds} onSave={handleSave} />;
}
