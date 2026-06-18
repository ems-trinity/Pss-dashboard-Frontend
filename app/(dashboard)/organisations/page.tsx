'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getOrgs, createOrg, updateOrg } from '@/lib/admin-api';
import type { Org } from '@/lib/admin-api';

export default function OrganisationsPage() {
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Org | null>(null);
  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getOrgs().then(setOrgs).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditing(null); setName(''); setError(''); setOpen(true); }
  function openEdit(o: Org) { setEditing(o); setName(o.name); setError(''); setOpen(true); }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        const updated = await updateOrg(editing.id, name.trim());
        setOrgs(prev => prev.map(o => o.id === editing.id ? { ...o, ...updated } : o));
      } else {
        const created = await createOrg(name.trim());
        setOrgs(prev => [...prev, { ...created, location_count: 0, pss_count: 0 }]);
      }
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Organisations</h1>
          <p className="text-sm text-[#6B7280]">{orgs.length} organisation{orgs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[#E5E7EB]">
            <tr>
              {['Name', 'Locations', 'PSS Units', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {orgs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No organisations yet</td></tr>
            )}
            {orgs.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#111827]">{o.name}</td>
                <td className="px-4 py-3 text-[#6B7280]">{o.location_count}</td>
                <td className="px-4 py-3 text-[#6B7280]">{o.pss_count}</td>
                <td className="px-4 py-3 text-xs text-[#6B7280]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(o)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Organisation' : 'Add Organisation'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Trinity Cleantech" autoFocus />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
