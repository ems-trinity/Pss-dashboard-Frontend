'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Power, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

// ── Types ──────────────────────────────────────────────────────────────────────
type PssAccess = {
  pss_id: string; pss_code: string;
  location_id: string; location_name: string; location_code: string;
};
type UserRow = {
  id: string; full_name: string; email: string; role: string;
  mobile: string | null; is_active: boolean; org_id: string; org_name: string;
  created_at: string; last_login_at: string | null;
  pss_access: PssAccess[];
};
type PssOption = {
  id: string; unique_code: string; kva_rating: number; ht_voltage_class: string;
  location_id: string; location_name: string; location_code: string;
  org_id: string; org_name: string;
};
type OrgOption = { id: string; name: string };

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-blue-100 text-blue-700',
  service:     'bg-amber-100 text-amber-700',
  user:        'bg-gray-100 text-gray-600',
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', service: 'Service', user: 'User',
};

type FormState = {
  full_name: string; email: string; mobile: string; role: string;
  org_id: string; pss_ids: string[];
};
const EMPTY_FORM: FormState = { full_name: '', email: '', mobile: '', role: 'user', org_id: '', pss_ids: [] };

// ── PssSelector: grouped checkboxes by location ────────────────────────────────
function PssSelector({
  options, selected, onChange, callerOrgId, isSuperAdmin,
}: {
  options: PssOption[]; selected: string[];
  onChange: (ids: string[]) => void;
  callerOrgId: string; isSuperAdmin: boolean;
}) {
  const [openOrgs, setOpenOrgs] = useState<Record<string, boolean>>({});

  // Group by org → location
  const byOrg: Record<string, { orgName: string; locs: Record<string, { locName: string; units: PssOption[] }> }> = {};
  for (const p of options) {
    if (!byOrg[p.org_id]) byOrg[p.org_id] = { orgName: p.org_name, locs: {} };
    if (!byOrg[p.org_id].locs[p.location_id])
      byOrg[p.org_id].locs[p.location_id] = { locName: p.location_name, units: [] };
    byOrg[p.org_id].locs[p.location_id].units.push(p);
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  return (
    <div className="border border-[#E5E7EB] rounded-lg overflow-y-auto max-h-52 text-sm">
      {Object.entries(byOrg).map(([orgId, { orgName, locs }]) => (
        <div key={orgId}>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setOpenOrgs(o => ({ ...o, [orgId]: !o[orgId] }))}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] text-xs font-semibold text-[#374151] text-left hover:bg-[#E5E7EB]"
            >
              {openOrgs[orgId] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {orgName}
            </button>
          )}
          {(!isSuperAdmin || openOrgs[orgId] || orgId === callerOrgId) &&
            Object.entries(locs).map(([locId, { locName, units }]) => (
              <div key={locId}>
                <div className="px-3 py-1 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide bg-[#FAFAFA]">
                  {locName}
                </div>
                {units.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 px-4 py-1.5 hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() => toggle(u.id)}
                      className="rounded"
                    />
                    <span className="text-xs text-[#111827]">{u.unique_code}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{u.ht_voltage_class} · {u.kva_rating}kVA</span>
                  </label>
                ))}
              </div>
            ))
          }
        </div>
      ))}
      {options.length === 0 && (
        <div className="px-3 py-4 text-xs text-[#9CA3AF] text-center">No sub stations available</div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AdminUsers() {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === 'super_admin';

  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [pssOptions, setPssOptions] = useState<PssOption[]>([]);
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [open,       setOpen]       = useState(false);
  const [editing,    setEditing]    = useState<UserRow | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [tempPw,     setTempPw]     = useState('');

  const load = useCallback(async () => {
    const [u, p, o] = await Promise.all([
      apiFetch<UserRow[]>('/admin/users'),
      apiFetch<PssOption[]>('/admin/users/pss-options'),
      isSuperAdmin ? apiFetch<OrgOption[]>('/admin/users/org-options') : Promise.resolve([]),
    ]);
    setUsers(u); setPssOptions(p); setOrgOptions(o);
    setLoading(false);
  }, [isSuperAdmin]);

  useEffect(() => { load().catch(console.error); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, org_id: me?.orgId ?? '' });
    setError(''); setTempPw(''); setOpen(true);
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({
      full_name: u.full_name ?? '',
      email: u.email,
      mobile: u.mobile ?? '',
      role: u.role,
      org_id: u.org_id,
      pss_ids: u.pss_access.map(a => a.pss_id),
    });
    setError(''); setTempPw(''); setOpen(true);
  }

  async function handleSave() {
    if (!form.email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await apiFetch(`/admin/users/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ full_name: form.full_name, email: form.email, role: form.role, mobile: form.mobile }),
        });
        await apiFetch(`/admin/users/${editing.id}/pss-access`, {
          method: 'PUT',
          body: JSON.stringify({ pss_ids: form.pss_ids }),
        });
        await load();
        setOpen(false);
      } else {
        const res = await apiFetch<{ user: UserRow; temp_password: string }>('/admin/users', {
          method: 'POST',
          body: JSON.stringify({
            full_name: form.full_name, email: form.email, role: form.role,
            mobile: form.mobile, org_id: form.org_id, pss_ids: form.pss_ids,
          }),
        });
        setTempPw(res.temp_password);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: UserRow) {
    await apiFetch(`/admin/users/${u.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !u.is_active }),
    }).catch(console.error);
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_active: !p.is_active } : p));
  }

  const roleOptions = isSuperAdmin
    ? ['admin', 'service', 'user']
    : ['admin', 'service', 'user'];

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading users…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111827]">User Management</h2>
          <p className="text-xs text-[#6B7280]">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              {['Name', 'Email / Mobile', isSuperAdmin ? 'Organisation' : null, 'Role', 'Sub Stations', 'Status', 'Last Login', '']
                .filter(Boolean)
                .map(h => (
                  <th key={h!} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {users.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No users</td></tr>
            )}
            {users.map(u => (
              <tr key={u.id} className={`hover:bg-[#F9FAFB] ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {u.role === 'super_admin' && <Shield className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                    <span className="font-medium text-[#111827]">{u.full_name || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#374151]">{u.email}</div>
                  {u.mobile && <div className="text-[10px] text-[#9CA3AF]">{u.mobile}</div>}
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-xs text-[#6B7280]">{u.org_name}</td>
                )}
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.pss_access.length === 0 ? (
                    <span className="text-xs text-[#9CA3AF]">
                      {u.role === 'admin' || u.role === 'service' || u.role === 'super_admin' ? 'All (by role)' : 'None'}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.pss_access.slice(0, 3).map(a => (
                        <Badge key={a.pss_id} variant="outline" className="text-[10px] px-1.5 py-0">{a.pss_code}</Badge>
                      ))}
                      {u.pss_access.length > 3 && (
                        <span className="text-[10px] text-[#9CA3AF]">+{u.pss_access.length - 3} more</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {u.role !== 'super_admin' && (
                      <button onClick={() => toggleStatus(u)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]" title={u.is_active ? 'Deactivate' : 'Activate'}>
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit dialog ─────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setError(''); setTempPw(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>

          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-[#111827]">User created. Share this one-time password:</p>
              <code className="block bg-[#F3F4F6] rounded-lg px-3 py-2.5 text-sm font-mono break-all text-[#7C3AED]">
                {tempPw}
              </code>
              <p className="text-xs text-[#9CA3AF]">This password is shown once and not stored in plaintext.</p>
              <Button className="w-full" onClick={() => { setOpen(false); setTempPw(''); }}>Done</Button>
            </div>
          ) : (
            <div className="space-y-3 py-1 max-h-[70vh] overflow-y-auto pr-1">
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jane Smith" />
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" disabled={!!editing} />
              </div>

              {/* Org (super_admin only, new user only) */}
              {isSuperAdmin && !editing && (
                <div className="space-y-1">
                  <Label>Organisation</Label>
                  <select
                    className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    value={form.org_id}
                    onChange={e => setForm(f => ({ ...f, org_id: e.target.value, pss_ids: [] }))}
                  >
                    <option value="">— select org —</option>
                    {orgOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}

              {/* Role */}
              <div className="space-y-1">
                <Label>Role</Label>
                <select
                  className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  {roleOptions.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <p className="text-[10px] text-[#9CA3AF]">
                  {form.role === 'admin' && 'Manages their org\'s PSS and users. Cannot edit raw config.'}
                  {form.role === 'service' && 'Read access + can request shutoff. Scoped to their org.'}
                  {form.role === 'user' && 'Access to explicitly assigned sub stations only.'}
                </p>
              </div>

              {/* PSS Access (for user role, or optionally for service) */}
              {(form.role === 'user' || form.role === 'service') && (
                <div className="space-y-1">
                  <Label>
                    Sub Station Access
                    <span className="ml-1 text-[10px] text-[#9CA3AF]">
                      ({form.pss_ids.length} selected)
                    </span>
                  </Label>
                  <PssSelector
                    options={pssOptions.filter(p => !form.org_id || p.org_id === form.org_id)}
                    selected={form.pss_ids}
                    onChange={ids => setForm(f => ({ ...f, pss_ids: ids }))}
                    callerOrgId={me?.orgId ?? ''}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
