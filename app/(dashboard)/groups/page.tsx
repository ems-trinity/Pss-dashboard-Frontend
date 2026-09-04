'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, X, Zap, User, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

// ── Types ──────────────────────────────────────────────────────────────────────
type Group = {
  id: string; name: string; description: string | null;
  member_count: number; pss_count: number; created_at: string;
};
type PssInGroup = {
  id: string; unique_code: string; kva_rating: number; ht_voltage_class: string;
  location_name: string | null; location_code: string; org_name: string;
};
type MemberInGroup = {
  id: string; full_name: string | null; email: string; role: string;
};
type PssOption = {
  id: string; unique_code: string; kva_rating: number; ht_voltage_class: string;
  location_code: string; location_name: string | null; org_name: string;
};
type UserOption = {
  id: string; full_name: string | null; email: string; role: string; org_name: string;
};

// ── Group detail panel (expandable inline) ─────────────────────────────────────
function GroupDetail({ group, onEdit, onChanged }: {
  group: Group; onEdit: () => void; onChanged: () => void;
}) {
  const [pssUnits,  setPssUnits]  = useState<PssInGroup[]>([]);
  const [members,   setMembers]   = useState<MemberInGroup[]>([]);
  const [pssOpts,   setPssOpts]   = useState<PssOption[]>([]);
  const [userOpts,  setUserOpts]  = useState<UserOption[]>([]);
  const [addPssId,  setAddPssId]  = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState<'pss' | 'members'>('pss');

  const load = useCallback(async () => {
    const [p, m] = await Promise.all([
      apiFetch<PssInGroup[]>(`/admin/groups/${group.id}/pss`).catch(() => []),
      apiFetch<MemberInGroup[]>(`/admin/groups/${group.id}/members`).catch(() => []),
    ]);
    setPssUnits(p); setMembers(m);
  }, [group.id]);

  const loadOpts = useCallback(async () => {
    const [p, u] = await Promise.all([
      apiFetch<PssOption[]>('/admin/users/pss-options').catch(() => []),
      apiFetch<UserOption[]>('/admin/users').catch(() => []),
    ]);
    setPssOpts(p); setUserOpts(u);
  }, []);

  useEffect(() => { load(); loadOpts(); }, [load, loadOpts]);

  async function addPss() {
    if (!addPssId) return;
    setSaving(true);
    await apiFetch(`/admin/groups/${group.id}/pss`, {
      method: 'POST', body: JSON.stringify({ pss_id: addPssId }),
    }).catch(() => {});
    setAddPssId('');
    await load();
    onChanged();
    setSaving(false);
  }

  async function removePss(pssId: string) {
    await apiFetch(`/admin/groups/${group.id}/pss/${pssId}`, { method: 'DELETE' }).catch(() => {});
    await load(); onChanged();
  }

  async function addMember() {
    if (!addUserId) return;
    setSaving(true);
    await apiFetch(`/admin/groups/${group.id}/members`, {
      method: 'POST', body: JSON.stringify({ user_id: addUserId }),
    }).catch(() => {});
    setAddUserId('');
    await load();
    onChanged();
    setSaving(false);
  }

  async function removeMember(userId: string) {
    await apiFetch(`/admin/groups/${group.id}/members/${userId}`, { method: 'DELETE' }).catch(() => {});
    await load(); onChanged();
  }

  // Filter out already-assigned
  const assignedPssIds  = new Set(pssUnits.map(p => p.id));
  const assignedUserIds = new Set(members.map(m => m.id));
  const availablePss    = pssOpts.filter(p => !assignedPssIds.has(p.id));
  const availableUsers  = userOpts.filter(u => !assignedUserIds.has(u.id));

  return (
    <div className="bg-[#F9FAFB] border-t border-[#E5E7EB] px-6 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-[#111827]">{group.name}</span>
          {group.description && <span className="ml-2 text-xs text-[#9CA3AF]">{group.description}</span>}
        </div>
        <button onClick={onEdit} className="p-1 rounded hover:bg-gray-200 text-[#6B7280]">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {(['pss', 'members'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            {t === 'pss' ? `Sub Stations (${pssUnits.length})` : `Members (${members.length})`}
          </button>
        ))}
      </div>

      {/* PSS tab */}
      {tab === 'pss' && (
        <div className="space-y-2">
          {/* Add picker */}
          <div className="flex gap-2">
            <select
              className="flex-1 border border-[#E5E7EB] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              value={addPssId}
              onChange={e => setAddPssId(e.target.value)}
            >
              <option value="">— add a sub station —</option>
              {availablePss.map(p => (
                <option key={p.id} value={p.id}>
                  {p.unique_code} · {p.kva_rating} kVA · {p.location_code} ({p.org_name})
                </option>
              ))}
            </select>
            <Button size="sm" onClick={addPss} disabled={!addPssId || saving}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {/* List */}
          {pssUnits.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] text-center py-3">No sub stations in this group yet</p>
          ) : (
            <div className="space-y-1">
              {pssUnits.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg border border-[#E5E7EB] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="font-mono text-xs font-semibold text-[#111827]">{p.unique_code}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{p.ht_voltage_class} · {p.kva_rating} kVA</span>
                    <span className="text-[10px] text-[#9CA3AF]">· {p.location_code} · {p.org_name}</span>
                  </div>
                  <button onClick={() => removePss(p.id)} className="p-0.5 rounded hover:bg-red-50 text-[#9CA3AF] hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div className="space-y-2">
          {/* Add picker */}
          <div className="flex gap-2">
            <select
              className="flex-1 border border-[#E5E7EB] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              value={addUserId}
              onChange={e => setAddUserId(e.target.value)}
            >
              <option value="">— add a user/customer —</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name ?? u.email} · {u.role} · {u.org_name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={addMember} disabled={!addUserId || saving}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {/* List */}
          {members.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] text-center py-3">No members in this group yet</p>
          ) : (
            <div className="space-y-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-white rounded-lg border border-[#E5E7EB] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#111827]">{m.full_name ?? m.email}</span>
                    <span className="text-[10px] text-[#9CA3AF]">· {m.email}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.role}</Badge>
                  </div>
                  <button onClick={() => removeMember(m.id)} className="p-0.5 rounded hover:bg-red-50 text-[#9CA3AF] hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const { user } = useAuth();
  const [groups,     setGroups]     = useState<Group[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [open,       setOpen]       = useState(false);
  const [editing,    setEditing]    = useState<Group | null>(null);
  const [form,       setForm]       = useState({ name: '', description: '' });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const load = useCallback(async () => {
    const data = await apiFetch<Group[]>('/admin/groups').catch(() => []);
    setGroups(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm({ name: '', description: '' }); setError(''); setOpen(true); }
  function openEdit(g: Group) { setEditing(g); setForm({ name: g.name, description: g.description ?? '' }); setError(''); setOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const body = JSON.stringify({ name: form.name.trim(), description: form.description || null });
      if (editing) {
        await apiFetch(`/admin/groups/${editing.id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/admin/groups', { method: 'POST', body });
      }
      await load();
      setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  const canManage = user?.role === 'admin' || user?.role === 'super_admin';

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Groups</h1>
          <p className="text-xs text-[#6B7280]">
            {groups.length} group{groups.length !== 1 ? 's' : ''} — bundle sub stations and assign members
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Group
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden divide-y divide-[#E5E7EB]">
        {groups.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
            No groups yet — create one to bundle sub stations and assign users
          </div>
        )}
        {groups.map(g => (
          <div key={g.id}>
            {/* Row */}
            <div
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] cursor-pointer"
              onClick={() => setExpanded(expanded === g.id ? null : g.id)}
            >
              <div className="text-[#9CA3AF]">
                {expanded === g.id
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#111827]">{g.name}</div>
                {g.description && <div className="text-xs text-[#9CA3AF] truncate">{g.description}</div>}
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6B7280] flex-shrink-0">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {g.pss_count} sub stations
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {g.member_count} members
                </span>
                <span className="text-[10px] text-[#9CA3AF]">{new Date(g.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === g.id && (
              <GroupDetail
                group={g}
                onEdit={() => openEdit(g)}
                onChanged={load}
              />
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Group' : 'Add Group'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Hyderabad Industrial Zone"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional — e.g. All PSS units in HYD zone"
              />
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
