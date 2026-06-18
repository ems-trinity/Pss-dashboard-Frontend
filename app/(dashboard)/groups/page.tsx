'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getGroups, createGroup, updateGroup, getGroupMembers } from '@/lib/admin-api';
import type { Group, GroupMember } from '@/lib/admin-api';

export default function GroupsPage() {
  const [items,   setItems]   = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [viewing, setViewing] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [form,    setForm]    = useState({ name: '', description: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getGroups().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditing(null); setForm({ name: '', description: '' }); setError(''); setOpen(true); }
  function openEdit(g: Group) { setEditing(g); setForm({ name: g.name, description: g.description ?? '' }); setError(''); setOpen(true); }

  async function openMembers(g: Group) {
    setViewing(g);
    const m = await getGroupMembers(g.id).catch(() => []);
    setMembers(m);
    setMembersOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: form.name.trim(), description: form.description || undefined };
      if (editing) {
        const updated = await updateGroup(editing.id, payload);
        setItems(prev => prev.map(g => g.id === editing.id ? { ...g, ...updated } : g));
      } else {
        const created = await createGroup(payload);
        setItems(prev => [...prev, { ...created, member_count: 0, pss_count: 0 }]);
      }
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-[#111827]">Groups</h1><p className="text-sm text-[#6B7280]">{items.length} group{items.length !== 1 ? 's' : ''}</p></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[#E5E7EB]">
            <tr>{['Name','Description','Members','PSS Units',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No groups yet</td></tr>}
            {items.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#111827]">{g.name}</td>
                <td className="px-4 py-3 text-[#6B7280] max-w-xs truncate">{g.description ?? '—'}</td>
                <td className="px-4 py-3 text-[#6B7280]">{g.member_count}</td>
                <td className="px-4 py-3 text-[#6B7280]">{g.pss_count}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openMembers(g)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]" title="View members"><Users className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(g)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><Pencil className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Group' : 'Add Group'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Hyderabad Branch" autoFocus /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional description" /></div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Members — {viewing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-1 max-h-64 overflow-y-auto">
            {members.length === 0 && <p className="text-sm text-[#9CA3AF] text-center py-4">No members yet</p>}
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-[#E5E7EB] last:border-0">
                <div>
                  <div className="text-sm font-medium text-[#111827]">{m.full_name ?? m.email}</div>
                  <div className="text-xs text-[#6B7280]">{m.email} · {m.role}</div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMembersOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
