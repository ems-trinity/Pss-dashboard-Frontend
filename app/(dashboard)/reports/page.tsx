'use client';
import { useState, useEffect } from 'react';
import { getEnergyReport, getFaultReport } from '@/lib/admin-api';
import type { EnergyRow, FaultRow } from '@/lib/admin-api';

export default function ReportsPage() {
  const [tab,     setTab]     = useState<'energy' | 'faults'>('energy');
  const [energy,  setEnergy]  = useState<EnergyRow[]>([]);
  const [faults,  setFaults]  = useState<FaultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [from,    setFrom]    = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => { loadReport(); }, [tab, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadReport() {
    setLoading(true);
    try {
      if (tab === 'energy') {
        const rows = await getEnergyReport({ from, to });
        setEnergy(rows);
      } else {
        const rows = await getFaultReport({ from, to });
        setFaults(rows);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-[#111827]">Reports</h1>
        <p className="text-sm text-[#6B7280]">Energy and fault summaries</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex border border-[#E5E7EB] rounded-lg overflow-hidden">
          {(['energy', 'faults'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm capitalize ${tab === t ? 'bg-[#2563EB] text-white' : 'text-[#6B7280] hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          From <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-[#E5E7EB] rounded px-2 py-1 text-sm" />
          To   <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="border border-[#E5E7EB] rounded px-2 py-1 text-sm" />
        </div>
      </div>

      {loading ? <div className="text-sm text-[#6B7280]">Loading…</div> : tab === 'energy' ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>{['PSS','Day','Avg kW','Peak kW','Avg PF'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {energy.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No data for selected range</td></tr>}
              {energy.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-[#111827]">{r.pss_code}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{new Date(r.day).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-2.5 font-mono text-[#111827]">{Number(r.avg_kw).toFixed(0)}</td>
                  <td className="px-4 py-2.5 font-mono text-[#111827]">{Number(r.peak_kw).toFixed(0)}</td>
                  <td className="px-4 py-2.5 font-mono text-[#111827]">{Number(r.avg_pf).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>{['PSS','Day','Severity','Event Type','Count'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {faults.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No faults in selected range</td></tr>}
              {faults.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-[#111827]">{r.pss_code}</td>
                  <td className="px-4 py-2.5 text-[#6B7280]">{new Date(r.day).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.severity}</span></td>
                  <td className="px-4 py-2.5 text-xs text-[#6B7280]">{r.event_type.replace(/_/g,' ')}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-[#111827]">{r.event_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
