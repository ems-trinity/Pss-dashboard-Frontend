'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getCustomers, createCustomer, updateCustomer, setCustomerStatus } from '@/lib/admin-api';
import type { Customer } from '@/lib/admin-api';

export default function CustomersPage() {
  const [items,   setItems]   = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form,    setForm]    = useState({ full_name: '', email: '', mobile: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [tempPw,  setTempPw]  = useState('');

  useEffect(() => {
    getCustomers().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditing(null); setForm({ full_name: '', email: '', mobile: '' }); setError(''); setTempPw(''); setOpen(true); }
  function openEdit(c: Customer) { setEditing(c); setForm({ full_name: c.full_name ?? '', email: c.email, mobile: c.mobile ?? '' }); setError(''); setTempPw(''); setOpen(true); }

  async function handleSave() {
    if (!form.email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        const updated = await updateCustomer(editing.id, form);
        setItems(prev => prev.map(c => c.id === editing.id ? { ...c, ...updated } : c));
        setOpen(false);
      } else {
        const { user, temp_password } = await createCustomer(form);
        setItems(prev => [...prev, user]);
        setTempPw(temp_password);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function toggleStatus(c: Customer) {
    await setCustomerStatus(c.id, !c.is_active).catch(console.error);
    setItems(prev => prev.map(p => p.id === c.id ? { ...p, is_active: !p.is_active } : p));
  }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Customers</h1>
          <p className="text-sm text-[#6B7280]">{items.length} customer{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[#E5E7EB]">
            <tr>
              {['Name', 'Email', 'Mobile', 'Status', 'Last Login', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No customers yet</td></tr>
            )}
            {items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#111827]">{c.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-[#6B7280]">{c.email}</td>
                <td className="px-4 py-3 text-[#6B7280]">{c.mobile ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${c.is_active ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6B7280]">
                  {c.last_login_at ? new Date(c.last_login_at).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleStatus(c)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"><Power className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setTempPw(''); setError(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-[#111827]">Customer created. Share this temporary password:</p>
              <code className="block bg-gray-100 rounded px-3 py-2 text-sm font-mono break-all">{tempPw}</code>
              <Button className="w-full" onClick={() => { setOpen(false); setTempPw(''); }}>Done</Button>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div className="space-y-1"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Jane Smith" /></div>
              <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="jane@company.com" /></div>
              <div className="space-y-1"><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm(f => ({...f, mobile: e.target.value}))} placeholder="+91 9876543210" /></div>
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
