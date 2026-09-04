'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { formatEnergy, formatPower } from '@/lib/utils';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────
type UnitRow = {
  id: string; unique_code: string; kva_rating: number;
  ht_voltage_class: string; location_name: string; location_code: string;
  last_seen_at: string | null;
};
type Summary = {
  kwh_today: number; avg_pf: number; peak_kw: number; avg_kw: number;
  total_faults: number; critical: number; warning: number;
  last_seen: string | null; oil_temp_c: number | null;
  winding_temp_c: number | null; oltc_position: number | null;
};
type PowerRow  = { ts: string; kw: number; pf: number; voltage_v: number; current_a: number };
type EnergyRow = { t: string; cumulative_kwh: number; delta_kwh: number };
type TxRow     = { ts: string; oil_temp_c: number; winding_temp_c: number };
type FaultRow  = {
  id: string; ts: string; event_type: string; severity: string;
  summary: string; component_name: string | null; component_type: string;
};

const SEV_DOT: Record<string, string> = {
  critical: '#EF4444', warning: '#F59E0B', info: '#60A5FA',
};

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

export default function AnalyticsPage() {
  const [units,   setUnits]   = useState<UnitRow[]>([]);
  const [selId,   setSelId]   = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [power,   setPower]   = useState<PowerRow[]>([]);
  const [energy,  setEnergy]  = useState<EnergyRow[]>([]);
  const [tx,      setTx]      = useState<TxRow[]>([]);
  const [faults,  setFaults]  = useState<FaultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load unit list once
  useEffect(() => {
    apiFetch<UnitRow[]>('/analytics/units')
      .then(rows => {
        setUnits(rows);
        if (rows.length > 0) setSelId(rows[0].id);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load per-unit data when selection changes
  const loadUnit = useCallback(async (pssId: string) => {
    setDataLoading(true);
    setError(null);
    try {
      const [s, p, e, t, f] = await Promise.all([
        apiFetch<Summary>(`/analytics/unit/${pssId}/summary`),
        apiFetch<PowerRow[]>(`/analytics/unit/${pssId}/power?hours=24`),
        apiFetch<EnergyRow[]>(`/analytics/unit/${pssId}/energy-today`),
        apiFetch<TxRow[]>(`/analytics/unit/${pssId}/transformer`),
        apiFetch<FaultRow[]>(`/analytics/unit/${pssId}/faults`),
      ]);
      setSummary(s);
      setPower(p.map(r => ({ ...r, kw: Number(r.kw), pf: Number(r.pf) })));
      setEnergy(e.map(r => ({ ...r, cumulative_kwh: Number(r.cumulative_kwh) })));
      setTx(t.map(r => ({ ...r, oil_temp_c: Number(r.oil_temp_c), winding_temp_c: Number(r.winding_temp_c) })));
      setFaults(f);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load unit data');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { if (selId) loadUnit(selId); }, [selId, loadUnit]);

  // Poll selected unit every 30s
  useEffect(() => {
    if (!selId) return;
    const id = setInterval(() => loadUnit(selId), 30_000);
    return () => clearInterval(id);
  }, [selId, loadUnit]);

  // ── Chart options ──────────────────────────────────────────────────────────
  const powerOption = {
    grid: { top: 28, right: 56, bottom: 40, left: 56 },
    legend: {
      top: 4, right: 4, data: ['kW', 'PF'],
      textStyle: { fontSize: 10, color: '#6B7280' },
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        fontSize: 9, color: '#9CA3AF',
        formatter: (v: number) => {
          const d = new Date(v);
          return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        },
      },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value', name: 'kW',
        nameTextStyle: { fontSize: 10, color: '#2563EB' },
        axisLabel: { fontSize: 9, color: '#2563EB' },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
      },
      {
        type: 'value', name: 'PF', min: 0.7, max: 1.0,
        nameTextStyle: { fontSize: 10, color: '#10B981' },
        axisLabel: { fontSize: 9, color: '#10B981', formatter: (v: number) => v.toFixed(2) },
        splitLine: { show: false },
      },
    ],
    tooltip: {
      trigger: 'axis',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any[]) => {
        const kw = params.find((p: { seriesName: string }) => p.seriesName === 'kW');
        const pf = params.find((p: { seriesName: string }) => p.seriesName === 'PF');
        const t  = new Date(params[0]?.axisValue);
        return `${t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}<br/>
          kW <b>${Number(kw?.value?.[1] ?? 0).toFixed(1)}</b> &nbsp;·&nbsp;
          PF <b>${Number(pf?.value?.[1] ?? 0).toFixed(3)}</b>`;
      },
    },
    series: [
      {
        name: 'kW', type: 'line', yAxisIndex: 0,
        data: power.map(r => [r.ts, r.kw]),
        smooth: true, symbol: 'none',
        lineStyle: { color: '#2563EB', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(37,99,235,0.18)' }, { offset: 1, color: 'rgba(37,99,235,0)' }] },
        },
      },
      {
        name: 'PF', type: 'line', yAxisIndex: 1,
        data: power.map(r => [r.ts, r.pf]),
        smooth: true, symbol: 'none',
        lineStyle: { color: '#10B981', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.12)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] },
        },
      },
    ],
  };

  const maxEnergyKwh = energy.length ? Math.max(...energy.map(r => Number(r.cumulative_kwh))) : 0;
  const eScale = maxEnergyKwh >= 1e9 ? { div: 1e9, unit: 'TWh' }
               : maxEnergyKwh >= 1e6 ? { div: 1e6, unit: 'GWh' }
               : maxEnergyKwh >= 1e3 ? { div: 1e3, unit: 'MWh' }
               : { div: 1, unit: 'kWh' };
  const energyOption = {
    grid: { top: 12, right: 16, bottom: 36, left: 60 },
    xAxis: {
      type: 'time',
      axisLabel: {
        fontSize: 9, color: '#9CA3AF',
        formatter: (v: number) => {
          const d = new Date(v);
          return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        },
      },
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: eScale.unit,
      nameTextStyle: { fontSize: 10, color: '#7C3AED' },
      axisLabel: { fontSize: 9, color: '#9CA3AF', formatter: (v: number) => (v / eScale.div).toFixed(v === 0 ? 0 : 2) },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (p: { value: [string, number] }[]) => {
        const { value: fv, unit: fu } = formatEnergy(Number(p[0].value[1]));
        return `${new Date(p[0].value[0]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}<br/><b>${fv} ${fu}</b> cumulative`;
      },
    },
    series: [{
      type: 'line',
      data: energy.map(r => [r.t, r.cumulative_kwh]),
      smooth: false, symbol: 'none',
      lineStyle: { color: '#7C3AED', width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(124,58,237,0.22)' }, { offset: 1, color: 'rgba(124,58,237,0)' }] },
      },
    }],
  };

  const txOption = {
    grid: { top: 28, right: 16, bottom: 36, left: 48 },
    legend: {
      top: 4, right: 4, data: ['Oil °C', 'Winding °C'],
      textStyle: { fontSize: 10, color: '#6B7280' },
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        fontSize: 9, color: '#9CA3AF',
        formatter: (v: number) => {
          const d = new Date(v);
          return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        },
      },
      axisLine: { lineStyle: { color: '#E5E7EB' } }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', name: '°C',
      nameTextStyle: { fontSize: 10, color: '#9CA3AF' },
      axisLabel: { fontSize: 9, color: '#9CA3AF' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    tooltip: { trigger: 'axis' },
    series: [
      {
        name: 'Oil °C', type: 'line',
        data: tx.map(r => [r.ts, r.oil_temp_c]),
        smooth: true, symbol: 'none',
        lineStyle: { color: '#F59E0B', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.15)' }, { offset: 1, color: 'rgba(245,158,11,0)' }] },
        },
      },
      {
        name: 'Winding °C', type: 'line',
        data: tx.map(r => [r.ts, r.winding_temp_c]),
        smooth: true, symbol: 'none',
        lineStyle: { color: '#EF4444', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.1)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] },
        },
      },
    ],
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 text-sm text-[#6B7280]">Loading units…</div>
  );

  const selUnit = units.find(u => u.id === selId);

  return (
    <div className="flex h-full min-h-0">
      {/* ── Unit sidebar ───────────────────────────────────────────────────── */}
      <div className="w-52 flex-shrink-0 border-r border-[#E5E7EB] bg-[#FAFAFA] overflow-y-auto">
        <div className="px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          Sub Stations
        </div>
        {units.map(u => {
          const online = isOnline(u.last_seen_at);
          const sel    = u.id === selId;
          return (
            <button
              key={u.id}
              onClick={() => setSelId(u.id)}
              className={`w-full text-left px-3 py-2.5 border-l-2 transition-colors ${
                sel
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-transparent hover:bg-[#F3F4F6]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: online ? '#16A34A' : '#9CA3AF' }}
                />
                <span className={`text-xs font-medium truncate ${sel ? 'text-[#1D4ED8]' : 'text-[#111827]'}`}>
                  {u.unique_code}
                </span>
              </div>
              <div className="text-[10px] text-[#9CA3AF] mt-0.5 ml-3.5 truncate">
                {u.ht_voltage_class} · {u.kva_rating >= 1000 ? `${u.kva_rating/1000}MVA` : `${u.kva_rating}kVA`}
              </div>
              <div className="text-[10px] text-[#9CA3AF] ml-3.5 truncate">{u.location_code}</div>
            </button>
          );
        })}
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#111827]">{selUnit?.unique_code ?? '—'}</h1>
            <p className="text-xs text-[#6B7280]">
              {selUnit?.location_name} · {selUnit?.ht_voltage_class} · {
                selUnit ? (selUnit.kva_rating >= 1000
                  ? `${selUnit.kva_rating / 1000} MVA`
                  : `${selUnit.kva_rating} kVA`)
                : ''
              }
            </p>
          </div>
          {summary && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isOnline(summary.last_seen)
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {isOnline(summary.last_seen) ? 'Online' : 'Offline'}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {dataLoading && !summary && (
          <div className="text-sm text-[#9CA3AF] py-8 text-center">Loading unit data…</div>
        )}

        {summary && (
          <>
            {/* ── KPI tiles ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="text-xs text-[#6B7280] mb-1">Energy Today</div>
                {(() => { const e = formatEnergy(summary.kwh_today); return (
                  <div className="text-xl font-mono font-bold text-[#7C3AED]">
                    {e.value} <span className="text-sm font-normal">{e.unit}</span>
                  </div>
                ); })()}
              </div>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="text-xs text-[#6B7280] mb-1">Avg Power Factor (24h)</div>
                <div className={`text-xl font-mono font-bold ${
                  summary.avg_pf >= 0.95 ? 'text-[#16A34A]'
                  : summary.avg_pf >= 0.90 ? 'text-[#F59E0B]'
                  : 'text-[#DC2626]'
                }`}>
                  {summary.avg_pf ? summary.avg_pf.toFixed(3) : '—'}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="text-xs text-[#6B7280] mb-1">Peak Demand (24h)</div>
                {(() => { const p = formatPower(summary.peak_kw); return (
                  <div className="text-xl font-mono font-bold text-[#2563EB]">
                    {p.value} <span className="text-sm font-normal">{p.unit}</span>
                  </div>
                ); })()}
              </div>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="text-xs text-[#6B7280] mb-1">Total Fault Events</div>
                <div className={`text-xl font-mono font-bold ${summary.total_faults > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {summary.total_faults}
                  {summary.critical > 0 && (
                    <span className="ml-2 text-xs font-normal text-red-500">
                      {summary.critical} critical
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Transformer vitals (if available) ──────────────────────── */}
            {(summary.oil_temp_c !== null) && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                  <div className="text-[10px] text-[#9CA3AF] mb-1">Oil Temperature</div>
                  <div className={`text-lg font-mono font-bold ${
                    (summary.oil_temp_c ?? 0) >= 85 ? 'text-[#DC2626]'
                    : (summary.oil_temp_c ?? 0) >= 75 ? 'text-[#F59E0B]'
                    : 'text-[#374151]'
                  }`}>
                    {summary.oil_temp_c?.toFixed(1)}°C
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                  <div className="text-[10px] text-[#9CA3AF] mb-1">Winding Temperature</div>
                  <div className={`text-lg font-mono font-bold ${
                    (summary.winding_temp_c ?? 0) >= 100 ? 'text-[#DC2626]'
                    : (summary.winding_temp_c ?? 0) >= 90 ? 'text-[#F59E0B]'
                    : 'text-[#374151]'
                  }`}>
                    {summary.winding_temp_c?.toFixed(1)}°C
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-3">
                  <div className="text-[10px] text-[#9CA3AF] mb-1">OLTC Position</div>
                  <div className="text-lg font-mono font-bold text-[#374151]">
                    {summary.oltc_position !== null
                      ? (summary.oltc_position >= 0 ? `+${summary.oltc_position}` : `${summary.oltc_position}`)
                      : '—'}
                  </div>
                </div>
              </div>
            )}

            {/* ── Power + PF chart ───────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="text-sm font-semibold text-[#111827] mb-0.5">Power &amp; Power Factor — Last 24h</div>
              <div className="text-xs text-[#9CA3AF] mb-3">kW (blue) · PF (green)</div>
              {power.length === 0
                ? <div className="h-[200px] flex items-center justify-center text-sm text-[#9CA3AF]">No telemetry data yet</div>
                : <ReactECharts option={powerOption} style={{ height: 200 }} />
              }
            </div>

            {/* ── Energy today ───────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#111827] mb-0.5">Energy Dispensed Today</div>
                  <div className="text-xs text-[#9CA3AF] mb-3">Cumulative {eScale.unit} from midnight</div>
                </div>
                {(() => {
                  const last = energy.length > 0 ? Number(energy[energy.length - 1].cumulative_kwh) : 0;
                  const ef = formatEnergy(last);
                  return (
                    <div className="text-right">
                      <div className="text-xl font-mono font-bold text-[#7C3AED]">{ef.value}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{ef.unit} total</div>
                    </div>
                  );
                })()}
              </div>
              {energy.length === 0
                ? <div className="h-[160px] flex items-center justify-center text-sm text-[#9CA3AF]">No data yet</div>
                : <ReactECharts option={energyOption} style={{ height: 160 }} />
              }
            </div>

            {/* ── Transformer temperature ────────────────────────────────── */}
            {tx.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="text-sm font-semibold text-[#111827] mb-0.5">Transformer Temperature — Last 24h</div>
                <div className="text-xs text-[#9CA3AF] mb-3">Oil temp (amber) · Winding temp (red)</div>
                <ReactECharts option={txOption} style={{ height: 180 }} />
              </div>
            )}

            {/* ── Fault log ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-[#111827]">Fault &amp; Event History</div>
                <div className="text-xs text-[#9CA3AF]">{faults.length} total events</div>
              </div>
              {faults.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9CA3AF]">No events recorded</div>
              ) : (
                <div className="overflow-y-auto max-h-[320px] space-y-1.5">
                  {faults.map(f => (
                    <div key={f.id} className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-[#F9FAFB]">
                      <span
                        className="mt-1 flex-shrink-0 w-2 h-2 rounded-full"
                        style={{ background: SEV_DOT[f.severity] ?? '#9CA3AF' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#111827] truncate">{f.summary}</div>
                        <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                          {f.component_name ?? f.component_type} · {f.event_type}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#9CA3AF] flex-shrink-0">{relTime(f.ts)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
