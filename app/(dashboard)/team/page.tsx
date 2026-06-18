'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getTeam, createTeamMember, updateTeamMember, setTeamMemberStatus } from '@/lib/admin-api';
import type { TeamMember } from '@/lib/admin-api';

export default function TeamPage() {
  const [items,   setItems]   = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form,    setForm]    = useState({ full_name: '', email: '', mobile: '', role: 'service' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [tempPw,  setTempPw]  = useState('');

  useEffect(() => {
    getTeam().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditing(null); setForm({ full_name: '', email: '', mobile: '', role: 'service' }); setError(''); setTempPw(''); setOpen(true); }
  function openEdit(m: TeamMember) { setEditing(m); setForm({ full_name: m.full_name ?? '', email: m.email, mobile: m.mobile ?? '', role: m.role }); setError(''); setTempPw(''); setOpen(true); }

  async function handleSave() {
    if (!form.email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        const updated = await updateTeamMember(editing.id, form);
        setItems(prev => prev.map(m => m.id === editing.id ? { ...m, ...updated } : m));
        setOpen(false);
      } else {
        const { user, temp_password } = await createTeamMember(form);
        setItems(prev => [...prev, user]);
        setTempPw(temp_password);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function toggleStatus(m: TeamMember) {
    await setTeamMemberStatus(m.id, !m.is_active).catch(console.error);
    setItems(prev => prev.map(p => p.id === m.id ? { ...p, is_active: !p.is_active } : p));
  }

  const ROLE_COLOR: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin:       'bg-blue-100 text-[#2563EB]',
    service:     'bg-green-100 text-green-700',
  };

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">My Team</h1>
          <p className="text-sm text-[#6B7280]">{items.length} member{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[#E5E7EB]">
            <tr>{['Name','Email','Mobile','Role','Status',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No team members yet</td></tr>}
            {items.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#111827]">{m.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-[#6B7280]">{m.email}</td>
                <td className="px-4 py-3 text-[#6B7280]">{m.mobile ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[m.role] ?? 'bg-gray-100 text-[#6B7280]'}`}>
                    {m.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3"><span className={`text-xs font-medium ${m.is_active ? 'text-green-600' : 'text-[#9CA3AF]'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleStatus(m)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><Power className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setTempPw(''); setError(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Member' : 'Add Team Member'}</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-[#111827]">Member created. Share this temporary password:</p>
              <code className="block bg-gray-100 rounded px-3 py-2 text-sm font-mono break-all">{tempPw}</code>
              <Button className="w-full" onClick={() => { setOpen(false); setTempPw(''); }}>Done</Button>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div className="space-y-1"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} /></div>
              <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
              <div className="space-y-1"><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))} /></div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="service">Service</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
