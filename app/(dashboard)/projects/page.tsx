'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, ChevronRight, ChevronDown, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiFetch, getPresets } from '@/lib/api';
import type { PssPreset } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

type Location = {
  id: string; unique_code: string; display_name: string | null;
  grid_supply_voltage: string; address: string | null;
  pss_count: number; org_id: string; org_name: string; is_active: boolean;
};
type PssUnit = {
  id: string; unique_code: string; kva_rating: number; ht_voltage_class: string;
  manufacturer_serial: string | null; is_active: boolean;
  preset_id: string | null; preset_name: string | null;
};
type OrgOption = { id: string; name: string; abbreviation: string | null };

const VOLTAGE_OPTS = ['33kV', '22kV', '11kV'];
const VOLTAGE_LABEL: Record<string, string> = { '33kV': '33 kV', '22kV': '22 kV', '11kV': '11 kV' };
const KVA_OPTS = [250, 500, 1000, 1500, 2000, 2500, 3150, 4000, 5000];

// ── Location row with expandable PSS list ─────────────────────────────────────
function LocationRow({ loc, onEdit, canManage, presets }: {
  loc: Location; onEdit: (l: Location) => void; canManage: boolean;
  presets: PssPreset[];
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [pssUnits,  setPssUnits]  = useState<PssUnit[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [pssDialog, setPssDialog] = useState(false);
  const [editPss,   setEditPss]   = useState<PssUnit | null>(null);
  const [pssForm,   setPssForm]   = useState({ kva: '1000', voltage: '33kV', serial: '', presetId: '' });
  const [saving,    setSaving]    = useState(false);
  const [pssError,  setPssError]  = useState('');

  async function toggle() {
    if (!expanded && pssUnits.length === 0) {
      setLoading(true);
      const units = await apiFetch<PssUnit[]>(`/admin/pss-units?location_id=${loc.id}`).catch(() => []);
      setPssUnits(units);
      setLoading(false);
    }
    setExpanded(e => !e);
  }

  function openAddPss() {
    setEditPss(null);
    setPssForm({ kva: '1000', voltage: '33kV', serial: '', presetId: '' });
    setPssError('');
    setPssDialog(true);
  }

  function openEditPss(u: PssUnit) {
    setEditPss(u);
    setPssForm({
      kva: String(u.kva_rating),
      voltage: u.ht_voltage_class,
      serial: u.manufacturer_serial ?? '',
      presetId: u.preset_id ?? '',
    });
    setPssError('');
    setPssDialog(true);
  }

  async function savePss() {
    setSaving(true); setPssError('');
    try {
      const preset_id = pssForm.presetId || null;
      const body = editPss
        ? JSON.stringify({ kva_rating: parseInt(pssForm.kva), manufacturer_serial: pssForm.serial || null, preset_id })
        : JSON.stringify({ location_id: loc.id, kva_rating: parseInt(pssForm.kva), ht_voltage_class: pssForm.voltage, manufacturer_serial: pssForm.serial || null, preset_id });
      const url = editPss ? `/admin/pss-units/${editPss.id}` : '/admin/pss-units';
      const result = await apiFetch<PssUnit>(url, { method: editPss ? 'PUT' : 'POST', body });
      setPssUnits(prev => editPss ? prev.map(x => x.id === result.id ? result : x) : [...prev, result]);
      setPssDialog(false);
    } catch (e) { setPssError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <>
      <tr className="hover:bg-[#FAFAFA] border-b border-[#E5E7EB]">
        <td className="px-4 py-3">
          <button onClick={toggle} className="flex items-center gap-2 text-left">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />}
            <MapPin className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
            <div>
              <span className="font-mono text-xs font-semibold text-[#2563EB]">{loc.unique_code}</span>
              {loc.display_name && <span className="ml-1.5 text-sm text-[#374151]">{loc.display_name}</span>}
            </div>
          </button>
        </td>
        <td className="px-4 py-3 text-xs text-[#6B7280]">{loc.org_name}</td>
        <td className="px-4 py-3">
          <span className="text-xs bg-gray-100 text-[#374151] px-1.5 py-0.5 rounded">{loc.grid_supply_voltage}</span>
        </td>
        <td className="px-4 py-3 text-xs text-[#6B7280] max-w-xs truncate">{loc.address ?? '—'}</td>
        <td className="px-4 py-3 text-xs text-[#6B7280]">{loc.pss_count} units</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {canManage && (
              <>
                <button onClick={() => onEdit(loc)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]" title="Edit location">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={openAddPss} className="p-1 rounded hover:bg-blue-50 text-[#2563EB]" title="Add sub station">
                  <Plus className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        loading ? (
          <tr><td colSpan={6} className="pl-12 py-2 text-xs text-[#9CA3AF]">Loading…</td></tr>
        ) : pssUnits.length === 0 ? (
          <tr><td colSpan={6} className="pl-12 py-2 text-xs text-[#9CA3AF]">No sub stations yet — click + to add one</td></tr>
        ) : (
          pssUnits.map(u => (
            <tr key={u.id} className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <td className="pl-12 pr-4 py-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-xs font-semibold text-[#111827]">{u.unique_code}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-xs text-[#6B7280]" colSpan={2}>{u.ht_voltage_class} · {u.kva_rating} kVA</td>
              <td className="px-4 py-2 text-xs text-[#6B7280]">{u.manufacturer_serial ?? '—'}</td>
              <td className="px-4 py-2">
                {u.preset_name ? (
                  <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-medium rounded">
                    {u.preset_name}
                  </span>
                ) : (
                  <span className="text-xs text-[#9CA3AF]">{u.is_active ? 'Active' : 'Inactive'}</span>
                )}
              </td>
              <td className="px-4 py-2">
                {canManage && (
                  <button onClick={() => openEditPss(u)} className="p-1 rounded hover:bg-gray-200 text-[#6B7280]">
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </td>
            </tr>
          ))
        )
      )}

      {/* PSS add/edit dialog */}
      <Dialog open={pssDialog} onOpenChange={v => !v && setPssDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPss ? 'Edit Sub Station' : `Add Sub Station — ${loc.unique_code}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>HT Voltage <span className="text-red-500">*</span></Label>
                <select
                  disabled={!!editPss}
                  className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
                  value={pssForm.voltage}
                  onChange={e => setPssForm(f => ({ ...f, voltage: e.target.value }))}
                >
                  {VOLTAGE_OPTS.map(v => <option key={v} value={v}>{VOLTAGE_LABEL[v]}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Rating (kVA) <span className="text-red-500">*</span></Label>
                <select
                  className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                  value={pssForm.kva}
                  onChange={e => setPssForm(f => ({ ...f, kva: e.target.value }))}
                >
                  {KVA_OPTS.map(k => <option key={k} value={k}>{k} kVA</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Manufacturer Serial</Label>
              <Input value={pssForm.serial} onChange={e => setPssForm(f => ({ ...f, serial: e.target.value }))} placeholder="MFR-2024-XXXXX" />
            </div>
            <div className="space-y-1">
              <Label>SLD Preset</Label>
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                value={pssForm.presetId}
                onChange={e => setPssForm(f => ({ ...f, presetId: e.target.value }))}
              >
                <option value="">— no preset —</option>
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {pssForm.presetId && (() => {
                const p = presets.find(x => x.id === pssForm.presetId);
                return p?.description ? (
                  <p className="text-[10px] text-[#6B7280]">{p.description}</p>
                ) : null;
              })()}
            </div>
            {!editPss && (
              <p className="text-[10px] text-[#9CA3AF]">
                Code assigned automatically as <span className="font-mono">{loc.unique_code}XX</span>
              </p>
            )}
            {pssError && <p className="text-xs text-red-600">{pssError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPssDialog(false)}>Cancel</Button>
            <Button onClick={savePss} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Location add/edit dialog ───────────────────────────────────────────────────
function LocationDialog({ open, editing, orgs, onClose, onSaved }: {
  open: boolean; editing: Location | null; orgs: OrgOption[];
  onClose: () => void; onSaved: (l: Location) => void;
}) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [orgId,       setOrgId]       = useState('');
  const [displayName, setDisplayName] = useState('');
  const [voltage,     setVoltage]     = useState('33kV');
  const [address,     setAddress]     = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (open) {
      setOrgId(editing?.org_id ?? (isSuperAdmin ? '' : user?.orgId ?? ''));
      setDisplayName(editing?.display_name ?? '');
      setVoltage(editing?.grid_supply_voltage ?? '33kV');
      setAddress(editing?.address ?? '');
      setError('');
    }
  }, [open, editing, isSuperAdmin, user?.orgId]);

  async function save() {
    if (!orgId && !editing) { setError('Select an organisation'); return; }
    setSaving(true); setError('');
    try {
      const body = editing
        ? JSON.stringify({ display_name: displayName || null, address: address || null })
        : JSON.stringify({ org_id: orgId, display_name: displayName || null, grid_supply_voltage: voltage, address: address || null });
      const url = editing ? `/admin/locations/${editing.id}` : '/admin/locations';
      const result = await apiFetch<Location>(url, { method: editing ? 'PUT' : 'POST', body });
      onSaved(result);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  const voltPrefix = voltage === '33kV' ? '36SS' : voltage === '22kV' ? '24SS' : '12SS';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          {isSuperAdmin && !editing && (
            <div className="space-y-1">
              <Label>Organisation <span className="text-red-500">*</span></Label>
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                value={orgId}
                onChange={e => setOrgId(e.target.value)}
              >
                <option value="">— select org —</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Hyderabad Hub" autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Grid Supply Voltage <span className="text-red-500">*</span></Label>
            <select
              disabled={!!editing}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
              value={voltage}
              onChange={e => setVoltage(e.target.value)}
            >
              {VOLTAGE_OPTS.map(v => <option key={v} value={v}>{VOLTAGE_LABEL[v]}</option>)}
            </select>
            {!editing && (
              <p className="text-[10px] text-[#9CA3AF]">Code prefix: <span className="font-mono">{voltPrefix}XXXX</span></p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Industrial Area, Hyderabad" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [orgs,      setOrgs]      = useState<OrgOption[]>([]);
  const [presets,   setPresets]   = useState<PssPreset[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [orgFilter, setOrgFilter] = useState('');
  const [dialog,    setDialog]    = useState(false);
  const [editing,   setEditing]   = useState<Location | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const load = useCallback(async () => {
    const params = orgFilter ? `?org_id=${orgFilter}` : '';
    const [locs, orgsData, presetsData] = await Promise.all([
      apiFetch<Location[]>(`/admin/locations${params}`).catch(() => []),
      isSuperAdmin ? apiFetch<OrgOption[]>('/admin/users/org-options').catch(() => []) : Promise.resolve([]),
      getPresets().catch(() => []),
    ]);
    setLocations(locs);
    if (isSuperAdmin) setOrgs(orgsData);
    setPresets(presetsData);
    setLoading(false);
  }, [orgFilter, isSuperAdmin]);

  useEffect(() => { load(); }, [load]);

  function openEdit(loc: Location) { setEditing(loc); setDialog(true); }
  function openAdd() { setEditing(null); setDialog(true); }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Locations</h1>
          <p className="text-xs text-[#6B7280]">
            {locations.length} location{locations.length !== 1 ? 's' : ''} — expand to view sub stations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <select
              className="border border-[#E5E7EB] rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
            >
              <option value="">All orgs</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          {canManage && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Location
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              {['Location', 'Organisation', 'Voltage', 'Address', 'Preset', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No locations yet</td></tr>
            )}
            {locations.map(loc => (
              <LocationRow
                key={loc.id}
                loc={loc}
                onEdit={openEdit}
                canManage={canManage}
                presets={presets}
              />
            ))}
          </tbody>
        </table>
      </div>

      <LocationDialog
        open={dialog}
        editing={editing}
        orgs={orgs}
        onClose={() => { setDialog(false); setEditing(null); }}
        onSaved={loc => {
          setLocations(prev =>
            editing
              ? prev.map(l => l.id === loc.id ? { ...l, ...loc } : l)
              : [...prev, { ...loc, pss_count: 0 }]
          );
        }}
      />
    </div>
  );
}
