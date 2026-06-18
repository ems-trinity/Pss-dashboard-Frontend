'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePss } from '@/hooks/use-pss';
import { StatusPie } from '@/components/monitoring/status-pie';
import { apiFetch } from '@/lib/api';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type PowerPoint = { t: string; total_kw: number; avg_pf: number; peak_kw: number };
type Range = '1h' | '6h' | '24h' | '7d';

const RANGES: Range[] = ['1h', '6h', '24h', '7d'];

export default function OverviewPage() {
  const { pss, loading: pssLoading } = usePss();
  const [range,   setRange]   = useState<Range>('1h');
  const [series,  setSeries]  = useState<PowerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPower = useCallback(async (r: Range) => {
    try {
      const data = await apiFetch<PowerPoint[]>(`/fleet/power?range=${r}`);
      setSeries(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPower(range);
    const id = setInterval(() => loadPower(range), 30_000);
    return () => clearInterval(id);
  }, [range, loadPower]);

  const online   = pss.filter(u => u.status !== 'offline');
  const totalKw  = online.reduce((s, u) => s + u.htKw, 0);
  const avgPf    = online.length ? online.reduce((s, u) => s + u.pf, 0) / online.length : 0;
  const avgOil   = online.length ? online.reduce((s, u) => s + u.oilT, 0) / online.length : 0;
  const faults   = pss.reduce((s, u) => s + u.faults, 0);

  const kpis = [
    { label: 'Total Load',    value: `${totalKw.toLocaleString('en-IN')} kW`, color: '#111827' },
    { label: 'Avg PF',        value: avgPf.toFixed(2),                        color: avgPf < 0.92 && online.length ? '#DC2626' : '#111827' },
    { label: 'Avg Oil Temp',  value: `${avgOil.toFixed(1)} °C`,               color: avgOil >= 85 ? '#DC2626' : avgOil >= 75 ? '#D97706' : '#111827' },
    { label: 'Active Faults', value: String(faults),                          color: faults > 0 ? '#DC2626' : '#16A34A' },
    { label: 'Units Online',  value: `${online.length} / ${pss.length}`,      color: '#111827' },
  ];

  function fmtTime(iso: string, r: Range) {
    const d = new Date(iso);
    if (r === '7d') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  const chartOption = {
    grid: { top: 16, right: 16, bottom: 40, left: 56 },
    xAxis: {
      type: 'category',
      data: series.map(p => fmtTime(p.t, range)),
      axisLabel: { fontSize: 10, color: '#6B7280', rotate: series.length > 30 ? 30 : 0 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      nameTextStyle: { color: '#6B7280', fontSize: 10 },
      axisLabel: { fontSize: 10, color: '#6B7280', formatter: (v: number) => v.toLocaleString('en-IN') },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    tooltip: {
      trigger: 'axis',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const p = params[0];
        return `${p.axisValue}<br/>Total: <b>${Number(p.value).toLocaleString('en-IN')} kW</b>`;
      },
    },
    series: [{
      type: 'line',
      data: series.map(p => p.total_kw),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#2563EB', width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(37,99,235,0.18)' },
            { offset: 1, color: 'rgba(37,99,235,0)' },
          ],
        },
      },
    }],
  };

  if (pssLoading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Fleet Overview</h1>
          <p className="text-sm text-[#6B7280]">{online.length} of {pss.length} unit{pss.length !== 1 ? 's' : ''} online</p>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-xs text-[#6B7280] mb-1">{k.label}</div>
            <div className="text-xl font-mono font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-[#111827]">Total Fleet Power (kW)</div>
            <div className="flex gap-1">
              {RANGES.map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    range === r ? 'bg-[#2563EB] text-white' : 'text-[#6B7280] hover:bg-gray-100'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {loading
            ? <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">Loading…</div>
            : series.length === 0
            ? <div className="h-[220px] flex items-center justify-center text-sm text-[#9CA3AF]">No telemetry data yet — start the mock generator</div>
            : <ReactECharts option={chartOption} style={{ height: 220 }} />
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
