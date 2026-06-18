'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getProjects, createProject, updateProject, getCustomers } from '@/lib/admin-api';
import type { Project, Customer } from '@/lib/admin-api';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  on_hold:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-[#6B7280]',
};

export default function ProjectsPage() {
  const [items,     setItems]     = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);
  const [editing,   setEditing]   = useState<Project | null>(null);
  const [form,      setForm]      = useState({ name: '', customer_id: '', status: 'active' });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    Promise.all([getProjects(), getCustomers()])
      .then(([p, c]) => { setItems(p); setCustomers(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditing(null); setForm({ name: '', customer_id: '', status: 'active' }); setError(''); setOpen(true); }
  function openEdit(p: Project) { setEditing(p); setForm({ name: p.name, customer_id: p.customer_id ?? '', status: p.status }); setError(''); setOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: form.name.trim(), customer_id: form.customer_id || undefined, status: form.status };
      if (editing) {
        const updated = await updateProject(editing.id, payload);
        setItems(prev => prev.map(p => p.id === editing.id ? { ...p, ...updated } : p));
      } else {
        const created = await createProject(payload);
        setItems(prev => [{ ...created, customer_name: null, customer_email: null, org_name: null }, ...prev]);
      }
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-[#111827]">Projects</h1><p className="text-sm text-[#6B7280]">{items.length} project{items.length !== 1 ? 's' : ''}</p></div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[#E5E7EB]">
            <tr>{['Name','Customer','Status','Created',''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No projects yet</td></tr>}
            {items.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#111827]">{p.name}</td>
                <td className="px-4 py-3 text-[#6B7280]">{p.customer_name ?? '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status.replace('_',' ')}</span></td>
                <td className="px-4 py-3 text-xs text-[#6B7280]">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><Pencil className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'Add Project'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label>Project Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Hyderabad Hub Upgrade" autoFocus /></div>
            <div className="space-y-1">
              <Label>Customer</Label>
              <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm" value={form.customer_id} onChange={e => setForm(f => ({...f, customer_id: e.target.value}))}>
                <option value="">— None —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name ?? c.email}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
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
