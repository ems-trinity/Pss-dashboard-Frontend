'use client';
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Info, Zap, RefreshCw } from 'lucide-react';
import { getGlobalEvents, getPss } from '@/lib/api';
import type { PssEvent, Pss } from '@/types';

const SEV_CONFIG = {
  critical: { label: 'Critical', dot: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50' },
  warning:  { label: 'Warning',  dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  info:     { label: 'Info',     dot: 'bg-blue-400',   text: 'text-[#2563EB]',  bg: 'bg-blue-50' },
};

function SevBadge({ sev }: { sev: string }) {
  const c = SEV_CONFIG[sev as keyof typeof SEV_CONFIG] ?? SEV_CONFIG.info;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function SevIcon({ sev }: { sev: string }) {
  if (sev === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  if (sev === 'warning')  return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
}

export default function EventLogsPage() {
  const [events,   setEvents]   = useState<PssEvent[]>([]);
  const [pssList,  setPssList]  = useState<Pss[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [severity, setSeverity] = useState('');
  const [evtType,  setEvtType]  = useState('');
  const [pssId,    setPssId]    = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGlobalEvents({
        limit: 200,
        severity:   severity   || undefined,
        event_type: evtType    || undefined,
        pss_id:     pssId      || undefined,
      });
      setEvents(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [severity, evtType, pssId]);

  useEffect(() => {
    getPss().then(setPssList).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derive unique event types from loaded events for the type filter
  const eventTypes = Array.from(new Set(events.map(e => e.type))).sort();

  const critCount = events.filter(e => e.sev === 'critical').length;
  const warnCount = events.filter(e => e.sev === 'warning').length;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Event Logs</h1>
          <p className="text-sm text-[#6B7280]">
            {events.length} event{events.length !== 1 ? 's' : ''}
            {critCount > 0 && <span className="ml-2 text-red-600 font-medium">· {critCount} critical</span>}
            {warnCount > 0 && <span className="ml-2 text-yellow-600 font-medium">· {warnCount} warning</span>}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-md hover:bg-gray-50 text-[#6B7280]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          className="border border-[#E5E7EB] rounded-md px-3 py-1.5 text-sm text-[#374151]"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <select
          value={pssId}
          onChange={e => setPssId(e.target.value)}
          className="border border-[#E5E7EB] rounded-md px-3 py-1.5 text-sm text-[#374151]"
        >
          <option value="">All sub-stations</option>
          {pssList.map(p => (
            <option key={p.id} value={p.id}>{p.code}</option>
          ))}
        </select>

        <select
          value={evtType}
          onChange={e => setEvtType(e.target.value)}
          className="border border-[#E5E7EB] rounded-md px-3 py-1.5 text-sm text-[#374151]"
        >
          <option value="">All event types</option>
          {eventTypes.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {(severity || pssId || evtType) && (
          <button
            onClick={() => { setSeverity(''); setPssId(''); setEvtType(''); }}
            className="px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#111827] underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-[#6B7280]">Loading…</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-12 text-center">
          <Zap className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
          <p className="text-sm text-[#9CA3AF]">No events match the current filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>
                {['', 'Time', 'PSS', 'Type', 'Component', 'Message', 'Fault Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {events.map(ev => (
                <>
                  <tr
                    key={ev.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                  >
                    <td className="pl-4 pr-2 py-3"><SevIcon sev={ev.sev} /></td>
                    <td className="px-4 py-3 text-xs text-[#6B7280] whitespace-nowrap">
                      {new Date(ev.ts).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {ev.pssCode ? (
                        <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{ev.pssCode}</span>
                      ) : <span className="text-[#9CA3AF]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#374151]">{ev.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">{ev.comp || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#111827] max-w-xs">{ev.msg}</td>
                    <td className="px-4 py-3">
                      {ev.fStatus ? <SevBadge sev={ev.sev} /> : <span className="text-[#9CA3AF] text-xs">—</span>}
                    </td>
                  </tr>
                  {expanded === ev.id && Object.keys(ev.detail ?? {}).length > 0 && (
                    <tr key={`${ev.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-10 py-2.5">
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                          {Object.entries(ev.detail).map(([k, v]) => (
                            <span key={k} className="text-xs text-[#6B7280]">
                              <span className="font-medium text-[#374151]">{k.replace(/_/g, ' ')}:</span>{' '}
                              {String(v)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
