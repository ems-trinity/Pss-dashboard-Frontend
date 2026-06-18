'use client';
import { usePss } from '@/hooks/use-pss';
import { StatusPie } from '@/components/monitoring/status-pie';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function OverviewPage() {
  const { pss, loading, error } = usePss();

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;
  if (error)   return <div className="p-6 text-sm text-red-600">{error}</div>;

  const online  = pss.filter(u => u.status !== 'offline');
  const totalKw = online.reduce((s, u) => s + u.htKw, 0);
  const avgPf   = online.length ? online.reduce((s, u) => s + u.pf, 0) / online.length : 0;
  const avgOil  = online.length ? online.reduce((s, u) => s + u.oilT, 0) / online.length : 0;
  const faults  = pss.reduce((s, u) => s + u.faults, 0);

  const barOption = {
    grid: { top: 8, right: 8, bottom: 32, left: 48 },
    xAxis: {
      type: 'category',
      data: pss.map(u => u.code),
      axisLabel: { fontSize: 10, color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#6B7280' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [{
      type: 'bar',
      data: pss.map(u => ({
        value: u.htKw,
        itemStyle: {
          color: u.status === 'offline' ? '#D1D5DB'
               : u.status === 'critical' ? '#EF4444'
               : u.status === 'warning'  ? '#F59E0B'
               : '#2563EB',
        },
      })),
      barMaxWidth: 48,
    }],
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) =>
        `${params[0].name}: ${params[0].value.toLocaleString('en-IN')} kW`,
    },
  };

  const kpis = [
    { label: 'Total Load',    value: `${totalKw.toLocaleString('en-IN')} kW`, color: '#111827' },
    { label: 'Avg PF',        value: avgPf.toFixed(2),        color: avgPf < 0.92 && online.length > 0 ? '#DC2626' : '#111827' },
    { label: 'Avg Oil Temp',  value: `${avgOil.toFixed(1)} °C`, color: avgOil >= 85 ? '#DC2626' : avgOil >= 75 ? '#D97706' : '#111827' },
    { label: 'Active Faults', value: String(faults),          color: faults > 0 ? '#DC2626' : '#16A34A' },
    { label: 'Units Online',  value: `${online.length} / ${pss.length}`, color: '#111827' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Fleet Overview</h1>
          <p className="text-sm text-[#6B7280]">
            {online.length} of {pss.length} unit{pss.length !== 1 ? 's' : ''} online
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-xs text-[#6B7280] mb-1">{k.label}</div>
            <div className="text-xl font-mono font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-sm font-semibold text-[#111827] mb-2">Load per Unit (kW)</div>
          {pss.length > 0
            ? <ReactECharts option={barOption} style={{ height: 220 }} />
            : <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">No data</div>
          }
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-sm font-semibold text-[#111827] mb-3">Status Distribution</div>
          <StatusPie pss={pss} />
        </div>
      </div>
    </div>
  );
}
