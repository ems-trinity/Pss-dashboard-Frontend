'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TelemetryCharts } from '@/components/monitoring/graphs/telemetry-charts';
import { getTelemetry, DEFAULT_THRESHOLDS } from '@/lib/api';
import type { TelemetrySeries } from '@/types';

const HOUR_OPTIONS = [
  { label: '1h',  value: 1   },
  { label: '6h',  value: 6   },
  { label: '24h', value: 24  },
  { label: '7d',  value: 168 },
];

export default function GraphsPage() {
  const { id }    = useParams<{ id: string }>();
  const [hours,   setHours]   = useState(24);
  const [series,  setSeries]  = useState<TelemetrySeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getTelemetry(id, hours)
      .then(setSeries)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load telemetry'))
      .finally(() => setLoading(false));
  }, [id, hours]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#111827]">Telemetry Graphs</h2>
        <div className="flex gap-1">
          {HOUR_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setHours(o.value)}
              className={`px-3 py-1 text.xs rounded transition-colors ${
                hours === o.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#2563EB]'
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {loading && <div className="text-sm text-[#6B7280]">Loading telemetry…</div>}
      {error   && <div className="text-sm text-red-600">{error}</div>}
      {series  && !loading && <TelemetryCharts series={series} thresholds={DEFAULT_THRESHOLDS} />}
    </div>
  );
}
