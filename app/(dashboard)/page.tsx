'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePss } from '@/hooks/use-pss';
import { StatusPie } from '@/components/monitoring/status-pie';
import { apiFetch } from '@/lib/api';
import { formatEnergy, formatPower } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type PowerPoint  = { t: string; total_kw: number; avg_pf: number; peak_kw: number };
type EnergyPoint = { t: string; cumulative_kwh: number; delta_kwh: number };
type FaultEvent  = { id: string; ts: string; severity: 'info' | 'warning' | 'critical'; component_type: string; event_type: string; message: string; pss_code: string | null };
type Range = '1h' | '6h' | '24h' | '7d';

const RANGES: Range[] = ['1h', '6h', '24h', '7d'];

const SEV_COLOR: Record<string, string> = {
  critical: '#EF4444',
  warning:  '#F59E0B',
  info:     '#60A5FA',
};

function fmtTime(iso: string, r: Range) {
  const d = new Date(iso);
  if (r === '7d') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OverviewPage() {
  const { pss, loading: pssLoading } = usePss();
  const [range,   setRange]   = useState<Range>('1h');
  const [series,  setSeries]  = useState<PowerPoint[]>([]);
  const [energy,  setEnergy]  = useState<EnergyPoint[]>([]);
  const [events,  setEvents]  = useState<FaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const liveKwh = energy.length ? Number(energy[energy.length - 1].cumulative_kwh) : 0;
  const liveDelta = energy.length ? Number(energy[energy.length - 1].delta_kwh) : 0;
  const prevKwhRef = useRef(liveKwh);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (liveKwh !== prevKwhRef.current) {
      prevKwhRef.current = liveKwh;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [liveKwh]);

  const loadPower = useCallback(async (r: Range) => {
    try {
      const data = await apiFetch<PowerPoint[]>(`/fleet/power?range=${r}`);
      setSeries(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const loadEnergy = useCallback(async () => {
    try {
      const data = await apiFetch<EnergyPoint[]>('/fleet/energy');
      setEnergy(data);
    } catch { /* silent */ }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const data = await apiFetch<FaultEvent[]>('/fleet/events');
      setEvents(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPower(range);
    const id = setInterval(() => loadPower(range), 30_000);
    return () => clearInterval(id);
  }, [range, loadPower]);

  useEffect(() => {
    loadEnergy();
    const id = setInterval(loadEnergy, 30_000);
    return () => clearInterval(id);
  }, [loadEnergy]);

  useEffect(() => {
    loadEvents();
    const id = setInterval(loadEvents, 60_000);
    return () => clearInterval(id);
  }, [loadEvents]);

  const online   = pss.filter(u => u.status !== 'offline');
  const normal   = pss.filter(u => u.status === 'normal').length;
  const warning  = pss.filter(u => u.status === 'warning').length;
  const critical = pss.filter(u => u.status === 'critical').length;
  const offline  = pss.filter(u => u.status === 'offline').length;
  const totalKw  = online.reduce((s, u) => s + u.htKw, 0);
  const avgPf    = online.length ? online.reduce((s, u) => s + u.pf, 0) / online.length : 0;
  const totalKva = pss.reduce((s, u) => s + u.kva, 0);
  const loadPct  = totalKva > 0 ? Math.round((totalKw / totalKva) * 100) : 0;
  const faults   = pss.reduce((s, u) => s + u.faults, 0);

  const pwFmt = formatPower(totalKw);
  const kpis = [
    { label: 'Total Load',    value: `${pwFmt.value} ${pwFmt.unit}`,  sub: `${loadPct}% of capacity`,   color: loadPct >= 90 ? '#DC2626' : loadPct >= 75 ? '#D97706' : '#2563EB' },
    { label: 'Avg PF',        value: avgPf.toFixed(2),                          sub: avgPf >= 0.95 ? 'Excellent' : avgPf >= 0.92 ? 'Good' : 'Needs correction', color: avgPf < 0.92 && online.length ? '#DC2626' : '#16A34A' },
    { label: 'Active Faults', value: String(faults),                            sub: `${events.filter(e => e.severity === 'critical').length} critical`,        color: faults > 0 ? '#DC2626' : '#16A34A' },
    { label: 'Units Online',  value: `${online.length} / ${pss.length}`,        sub: online.length === pss.length ? 'All operational' : `${pss.length - online.length} offline`, color: online.length < pss.length ? '#DC2626' : '#111827' },
  ];

  const labels = series.map(p => fmtTime(p.t, range));

  // Main chart: Fleet Power + PF dual-axis
  const powerOption = {
    grid: { top: 28, right: 60, bottom: 36, left: 64 },
    legend: { top: 4, right: 4, data: ['Total kW', 'Power Factor'], textStyle: { fontSize: 11, color: '#6B7280' } },
    xAxis: {
      type: 'category', data: labels, boundaryGap: false,
      axisLabel: { fontSize: 10, color: '#6B7280', rotate: series.length > 36 ? 30 : 0 },
      axisTick: { show: false }, axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: [
      { type: 'value', name: 'kW', nameTextStyle: { color: '#6B7280', fontSize: 10 },
        axisLabel: { fontSize: 10, color: '#6B7280', formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v) },
        splitLine: { lineStyle: { color: '#F3F4F6' } } },
      { type: 'value', name: 'PF', min: 0.7, max: 1.0,
        nameTextStyle: { color: '#F59E0B', fontSize: 10 },
        axisLabel: { fontSize: 10, color: '#F59E0B', formatter: (v: number) => v.toFixed(2) },
        splitLine: { show: false } },
    ],
    tooltip: {
      trigger: 'axis',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const t  = params[0]?.axisValue ?? '';
        const kw = params.find((p: { seriesName: string }) => p.seriesName === 'Total kW');
        const pf = params.find((p: { seriesName: string }) => p.seriesName === 'Power Factor');
        return `${t}<br/><b>${Number(kw?.value ?? 0).toLocaleString('en-IN')} kW</b> &nbsp;·&nbsp; PF ${Number(pf?.value ?? 0).toFixed(3)}`;
      },
    },
    series: [
      { name: 'Total kW', type: 'line', yAxisIndex: 0, data: series.map(p => Number(p.total_kw)),
        smooth: true, symbol: 'none', lineStyle: { color: '#2563EB', width: 2.5 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(37,99,235,0.22)' }, { offset: 1, color: 'rgba(37,99,235,0)' }] } } },
      { name: 'Power Factor', type: 'line', yAxisIndex: 1, data: series.map(p => Number(p.avg_pf)),
        smooth: true, symbol: 'none', lineStyle: { color: '#F59E0B', width: 2, type: 'dashed' } },
    ],
  };

  // Energy dispensed: always-increasing cumulative, auto-scale unit
  const maxKwh = energy.length ? Math.max(...energy.map(p => Number(p.cumulative_kwh))) : 0;
  const eScale = maxKwh >= 1e9 ? { div: 1e9, unit: 'TWh' }
               : maxKwh >= 1e6 ? { div: 1e6, unit: 'GWh' }
               : maxKwh >= 1e3 ? { div: 1e3, unit: 'MWh' }
               : { div: 1, unit: 'kWh' };
  const energyLabels = energy.map(p => {
    const d = new Date(p.t);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  });
  const energyOption = {
    grid: { top: 8, right: 8, bottom: 28, left: 60 },
    xAxis: {
      type: 'category', data: energyLabels, boundaryGap: false,
      axisLabel: { fontSize: 9, color: '#9CA3AF', interval: Math.max(0, Math.floor(energyLabels.length / 5) - 1) },
      axisTick: { show: false }, axisLine: { lineStyle: { color: '#E5E7EB' } },
    },
    yAxis: {
      type: 'value', name: eScale.unit,
      nameTextStyle: { fontSize: 9, color: '#9CA3AF' },
      axisLabel: { fontSize: 9, color: '#9CA3AF', formatter: (v: number) => (v / eScale.div).toFixed(v === 0 ? 0 : 2) },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    tooltip: {
      trigger: 'axis',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (p: any[]) => {
        const { value: fv, unit: fu } = formatEnergy(Number(p[0].value));
        return `${p[0].axisValue}<br/><b>${fv} ${fu}</b>`;
      },
    },
    series: [{
      type: 'line', data: energy.map(p => Number(p.cumulative_kwh)),
      smooth: true, symbol: 'none',
      lineStyle: { color: '#8B5CF6', width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(139,92,246,0.25)' }, { offset: 1, color: 'rgba(139,92,246,0)' }] } },
    }],
  };

  if (pssLoading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-[#111827]">Fleet Overview</h1>
        <p className="text-sm text-[#6B7280]">{online.length} of {pss.length} sub station{pss.length !== 1 ? 's' : ''} online</p>
      </div>

      {/* KPI tiles — 4 tiles, no oil temp */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="text-xs text-[#6B7280] mb-1">{k.label}</div>
            <div className="text-xl font-mono font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs mt-1" style={{ color: k.color }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main chart: Power + PF */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-[#111827]">Total Power and Power Factor</div>
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
          ? <div className="h-[240px] flex items-center justify-center text-sm text-[#9CA3AF]">Loading…</div>
          : series.length === 0
          ? <div className="h-[240px] flex items-center justify-center text-sm text-[#9CA3AF]">No telemetry data yet</div>
          : <ReactECharts option={powerOption} style={{ height: 240 }} />
        }
      </div>

      {/* Energy dispensed (today) */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-[#111827]">Energy Dispensed Today ({eScale.unit})</div>
            <div className="text-xs text-[#6B7280]">Cumulative fleet output since midnight</div>
          </div>
          {/* Floating live value box */}
          {(() => {
            const live = formatEnergy(liveKwh);
            const delta = formatEnergy(liveDelta);
            return (
              <div className={`text-right rounded-lg border px-3 py-2 transition-colors duration-300 ${
                flash ? 'border-[#8B5CF6] bg-purple-50' : 'border-[#E5E7EB] bg-[#F9FAFB]'
              }`}>
                <div className="text-[10px] text-[#9CA3AF] mb-0.5">Now</div>
                <div className="text-lg font-mono font-bold text-[#8B5CF6]">{live.value} <span className="text-xs font-normal">{live.unit}</span></div>
                <div className="text-[10px] text-[#9CA3AF]">+{delta.value} {delta.unit} last min</div>
              </div>
            );
          })()}
        </div>
        {energy.length === 0
          ? <div className="h-[180px] flex items-center justify-center text-sm text-[#9CA3AF]">No data yet</div>
          : <ReactECharts option={energyOption} style={{ height: 180 }} />
        }
      </div>

      {/* Bottom row: SS status legend + fault log */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Sub station status — pie + colour legend with counts */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-sm font-semibold text-[#111827] mb-0.5">Sub Station Status</div>
          <div className="text-xs text-[#6B7280] mb-3">{pss.length} total units</div>
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <StatusPie pss={pss} />
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {[
                { label: 'Healthy',  count: normal,   dot: '#22C55E', color: '#15803D' },
                { label: 'Warning',  count: warning,  dot: '#F59E0B', color: '#B45309' },
                { label: 'Critical', count: critical, dot: '#EF4444', color: '#B91C1C' },
                { label: 'Offline',  count: offline,  dot: '#9CA3AF', color: '#6B7280' },
              ].map(({ label, count, dot, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />
                  <span className="text-xs text-[#6B7280] w-14">{label}</span>
                  <span className="text-sm font-mono font-bold" style={{ color }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fault event log — scrollable, all logs */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex flex-col">
          <div className="text-sm font-semibold text-[#111827] mb-0.5">Fault Event Log</div>
          <div className="text-xs text-[#6B7280] mb-3">{events.length} events · scroll for history</div>
          {events.length === 0
            ? <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
                <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center text-xl text-[#16A34A]">✓</div>
                <div className="text-sm font-medium text-[#16A34A]">No events recorded</div>
              </div>
            : <div className="overflow-y-auto max-h-[260px] -mx-1 space-y-1 pr-1">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-[#F9FAFB]">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEV_COLOR[ev.severity] }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-[#111827] truncate">{ev.message}</span>
                        <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">{relTime(ev.ts)}</span>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF]">{ev.pss_code ?? 'Fleet'} · {ev.component_type} · {ev.event_type}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
