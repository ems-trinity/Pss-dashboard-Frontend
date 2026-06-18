'use client';
import { useState, useEffect } from 'react';
import { getAuditLog } from '@/lib/admin-api';
import type { AuditEntry } from '@/lib/admin-api';

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState('');

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const data = await getAuditLog({ action: action || undefined, limit: 200 });
      setEntries(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-lg font-bold text-[#111827]">Audit Log</h1><p className="text-sm text-[#6B7280]">Last 200 entries</p></div>
        <div className="flex gap-2">
          <input value={action} onChange={e => setAction(e.target.value)} placeholder="Filter by action…"
            className="border border-[#E5E7EB] rounded-md px-3 py-1.5 text-sm w-48" />
          <button onClick={load} className="px-3 py-1.5 bg-[#2563EB] text-white rounded-md text-sm hover:bg-[#1D4ED8]">Apply</button>
        </div>
      </div>

      {loading ? <div className="text-sm text-[#6B7280]">Loading…</div> : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>{['Timestamp','User','Action','Target','Details'].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {entries.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No audit entries</td></tr>}
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs text-[#6B7280] whitespace-nowrap">
                    {new Date(e.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-[#111827]">{e.user_name ?? e.user_email ?? 'System'}</td>
                  <td className="px-4 py-2.5"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{e.action}</code></td>
                  <td className="px-4 py-2.5 text-xs text-[#6B7280]">{e.target_type ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6B7280] max-w-xs truncate">
                    {e.details ? JSON.stringify(e.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
