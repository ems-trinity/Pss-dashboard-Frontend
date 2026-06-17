'use client';
import { usePss } from '@/hooks/use-pss';
import { PssCard } from '@/components/monitoring/pss-card';
import { StatusPie } from '@/components/monitoring/status-pie';

export default function OverviewPage() {
  const { pss, loading, error } = usePss();

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading PSS units…</div>;
  if (error)   return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[#111827]">PSS Overview</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{pss.length} unit{pss.length !== 1 ? 's' : ''} monitored</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pss.map(unit => <PssCard key={unit.id} unit={unit} />)}
            {pss.length === 0 && (
              <div className="col-span-3 text-sm text-[#9CA3AF] text-center py-12">
                No PSS units found
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-sm font-semibold text-[#111827] mb-3">Status Distribution</div>
          <StatusPie pss={pss} />
        </div>
      </div>
    </div>
  );
}
