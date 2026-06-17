'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUsers, createUser, updateUser, setUserStatus } from '@/lib/api';
import type { User, Pss } from '@/types';

const ROLE_LABELS: Record<User['role'], string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  service:     'Service',
  user:        'User',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdminUsers({ pss }: { pss: Pss[] }) {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form,    setForm]    = useState<{ name: string; email: string; role: User['role']; access: string[] }>({
    name: '', email: '', role: 'user', access: [],
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [tempPw, setTempPw] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', role: 'user', access: [] });
    setError(''); setTempPw('');
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, access: u.access });
    setError(''); setTempPw('');
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true); setError('');
    try {
      if (editing) {
        const updated = await updateUser(editing.id, form);
        setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...updated } : u));
        setOpen(false);
      } else {
        const { user, tempPassword } = await createUser(form);
        setUsers(prev => [...prev, user]);
        setTempPw(tempPassword);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: User) {
    await setUserStatus(u.id, !u.active).catch(console.error);
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, active: !p.active } : p));
  }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading users…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#111827]">Users ({users.length})</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[#E5E7EB]">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Login', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No users found</td>
              </tr>
            )}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[#111827]">{u.name}</td>
                <td className="px-4 py-3 text-[#6B7280]">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.active ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6B7280]">
                  {u.login ? new Date(u.login).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleStatus(u)}
                      className="p-1 rounded hover:bg-gray-100 text-[#6B7280]"
                      title={u.active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setError(''); setTempPw(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>

          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-[#111827]">
                User created successfully. Share this temporary password with them:
              </p>
              <code className="block bg-gray-100 rounded-md px-3 py-2 text-sm font-mono break-all">
                {tempPw}
              </code>
              <Button className="w-full" onClick={() => { setOpen(false); setTempPw(''); }}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select
                  className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}
                >
                  {(Object.entries(ROLE_LABELS) as [User['role'], string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
