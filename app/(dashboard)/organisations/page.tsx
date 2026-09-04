'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, ChevronRight, ChevronDown, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

// ── Types ──────────────────────────────────────────────────────────────────────
type Org = {
  id: string; name: string; abbreviation: string | null; unique_code: string | null;
  location_count: number; pss_count: number; created_at: string;
};
type Location = {
  id: string; unique_code: string; display_name: string | null;
  grid_supply_voltage: string; address: string | null;
  pss_count: number; org_id: string; org_name: string; is_active: boolean;
};
type PssUnit = {
  id: string; unique_code: string; kva_rating: number; ht_voltage_class: string;
  manufacturer_serial: string | null; is_active: boolean; created_at: string;
  location_id: string; location_code: string; location_name: string | null;
  org_id: string; org_name: string;
};

const VOLTAGE_OPTS = ['33kV', '22kV', '11kV'];
const VOLTAGE_LABEL: Record<string, string> = { '33kV': '33 kV', '22kV': '22 kV', '11kV': '11 kV' };
const KVA_OPTS = [250, 500, 1000, 1500, 2000, 2500, 3150, 4000, 5000];

// ── Org dialog ─────────────────────────────────────────────────────────────────
function OrgDialog({ open, editing, onClose, onSaved }: {
  open: boolean; editing: Org | null;
  onClose: () => void; onSaved: (o: Org) => void;
}) {
  const [name, setName]   = useState('');
  const [abbr, setAbbr]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (open) { setName(editing?.name ?? ''); setAbbr(editing?.abbreviation ?? ''); setError(''); }
  }, [open, editing]);

  async function save() {
    if (!name.trim() || (!editing && !abbr.trim())) {
      setError('Name and abbreviation are required'); return;
    }
    setSaving(true); setError('');
    try {
      const body = editing
        ? JSON.stringify({ name: name.trim(), abbreviation: abbr.trim() })
        : JSON.stringify({ name: name.trim(), abbreviation: abbr.trim() });
      const url = editing ? `/admin/organisations/${editing.id}` : '/admin/organisations';
      const result = await apiFetch<Org>(url, { method: editing ? 'PUT' : 'POST', body });
      onSaved(result);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Edit Organisation' : 'Add Organisation'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label>Organisation Name <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Trinity Cleantech Pvt. Ltd." autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Abbreviation <span className="text-red-500">*</span></Label>
            <Input
              value={abbr}
              onChange={e => setAbbr(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="TCPL"
              disabled={!!editing}
            />
            {!editing && abbr && (
              <p className="text-[10px] text-[#9CA3AF]">
                Code will be generated as <span className="font-mono">{abbr}-SS-000001</span>
              </p>
            )}
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

// ── Location dialog ────────────────────────────────────────────────────────────
function LocationDialog({ open, orgId, editing, onClose, onSaved }: {
  open: boolean; orgId: string; editing: Location | null;
  onClose: () => void; onSaved: (l: Location) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [voltage, setVoltage]         = useState('33kV');
  const [address, setAddress]         = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    if (open) {
      setDisplayName(editing?.display_name ?? '');
      setVoltage(editing?.grid_supply_voltage ?? '33kV');
      setAddress(editing?.address ?? '');
      setError('');
    }
  }, [open, editing]);

  async function save() {
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

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Hyderabad Hub" />
          </div>
          <div className="space-y-1">
            <Label>Grid Supply Voltage <span className="text-red-500">*</span></Label>
            <select
              disabled={!!editing}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50"
              value={voltage}
              onChange={e => setVoltage(e.target.value)}
            >
              {VOLTAGE_OPTS.map(v => <option key={v} value={v}>{VOLTAGE_LABEL[v]}</option>)}
            </select>
            {!editing && (
              <p className="text-[10px] text-[#9CA3AF]">
                Code prefix: {voltage === '33kV' ? '36SS' : voltage === '22kV' ? '24SS' : '12SS'}XXXX
              </p>
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

// ── PSS dialog ─────────────────────────────────────────────────────────────────
function PssDialog({ open, locationId, locationCode, editing, onClose, onSaved }: {
  open: boolean; locationId: string; locationCode: string; editing: PssUnit | null;
  onClose: () => void; onSaved: (p: PssUnit) => void;
}) {
  const [kva, setKva]     = useState('1000');
  const [voltage, setVoltage] = useState('33kV');
  const [serial, setSerial]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (open) {
      setKva(String(editing?.kva_rating ?? 1000));
      setVoltage(editing?.ht_voltage_class ?? '33kV');
      setSerial(editing?.manufacturer_serial ?? '');
      setError('');
    }
  }, [open, editing]);

  async function save() {
    setSaving(true); setError('');
    try {
      const body = editing
        ? JSON.stringify({ kva_rating: parseInt(kva), manufacturer_serial: serial || null })
        : JSON.stringify({ location_id: locationId, kva_rating: parseInt(kva), ht_voltage_class: voltage, manufacturer_serial: serial || null });
      const url = editing ? `/admin/pss-units/${editing.id}` : '/admin/pss-units';
      const result = await apiFetch<PssUnit>(url, { method: editing ? 'PUT' : 'POST', body });
      onSaved(result);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Sub Station' : `Add Sub Station — ${locationCode}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>HT Voltage Class <span className="text-red-500">*</span></Label>
              <select
                disabled={!!editing}
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-50"
                value={voltage}
                onChange={e => setVoltage(e.target.value)}
              >
                {VOLTAGE_OPTS.map(v => <option key={v} value={v}>{VOLTAGE_LABEL[v]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Rating (kVA) <span className="text-red-500">*</span></Label>
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                value={kva}
                onChange={e => setKva(e.target.value)}
              >
                {KVA_OPTS.map(k => <option key={k} value={k}>{k} kVA</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Manufacturer Serial</Label>
            <Input value={serial} onChange={e => setSerial(e.target.value)} placeholder="MFR-2024-XXXXX" />
          </div>
          {!editing && (
            <p className="text-[10px] text-[#9CA3AF]">
              Unit code will be assigned automatically as <span className="font-mono">{locationCode}XX</span>
            </p>
          )}
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

// ── Location row with PSS list ─────────────────────────────────────────────────
function LocationRow({ loc, onEdit, onPssAdded }: {
  loc: Location;
  onEdit: (l: Location) => void;
  onPssAdded: (locId: string, pss: PssUnit) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pssUnits, setPssUnits] = useState<PssUnit[]>([]);
  const [loadingPss, setLoadingPss] = useState(false);
  const [pssDialog, setPssDialog] = useState(false);
  const [editingPss, setEditingPss] = useState<PssUnit | null>(null);

  async function expand() {
    if (!expanded && pssUnits.length === 0) {
      setLoadingPss(true);
      const units = await apiFetch<PssUnit[]>(`/admin/pss-units?location_id=${loc.id}`).catch(() => []);
      setPssUnits(units);
      setLoadingPss(false);
    }
    setExpanded(e => !e);
  }

  return (
    <>
      <tr className="hover:bg-[#FAFAFA] text-sm">
        <td className="pl-10 pr-2 py-2.5">
          <button onClick={expand} className="flex items-center gap-1.5 text-[#374151]">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <MapPin className="w-3 h-3 text-[#9CA3AF]" />
            <span className="font-mono text-xs text-[#2563EB]">{loc.unique_code}</span>
            <span className="text-[#374151]">{loc.display_name ?? '—'}</span>
          </button>
        </td>
        <td className="px-2 py-2.5">
          <span className="text-xs text-[#6B7280] bg-gray-100 px-1.5 py-0.5 rounded">
            {loc.grid_supply_voltage}
          </span>
        </td>
        <td className="px-2 py-2.5 text-xs text-[#6B7280]">{loc.address ?? '—'}</td>
        <td className="px-2 py-2.5 text-xs text-[#6B7280]">{loc.pss_count} units</td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(loc)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]">
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => { setEditingPss(null); setPssDialog(true); }}
              className="p-1 rounded hover:bg-blue-50 text-[#2563EB]"
              title="Add sub station"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        loadingPss ? (
          <tr><td colSpan={5} className="pl-16 py-1.5 text-xs text-[#9CA3AF]">Loading…</td></tr>
        ) : pssUnits.length === 0 ? (
          <tr><td colSpan={5} className="pl-16 py-1.5 text-xs text-[#9CA3AF]">No sub stations yet</td></tr>
        ) : (
          pssUnits.map(u => (
            <tr key={u.id} className="bg-[#F9FAFB] text-sm">
              <td className="pl-16 pr-2 py-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-xs font-semibold text-[#111827]">{u.unique_code}</span>
                </div>
              </td>
              <td className="px-2 py-2 text-xs text-[#6B7280]">{u.ht_voltage_class}</td>
              <td className="px-2 py-2 text-xs text-[#6B7280]">{u.manufacturer_serial ?? '—'}</td>
              <td className="px-2 py-2 text-xs text-[#6B7280]">{u.kva_rating} kVA</td>
              <td className="px-2 py-2">
                <button
                  onClick={() => { setEditingPss(u); setPssDialog(true); }}
                  className="p-1 rounded hover:bg-gray-200 text-[#6B7280]"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))
        )
      )}

      <PssDialog
        open={pssDialog}
        locationId={loc.id}
        locationCode={loc.unique_code}
        editing={editingPss}
        onClose={() => { setPssDialog(false); setEditingPss(null); }}
        onSaved={p => {
          setPssUnits(prev => editingPss ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
          onPssAdded(loc.id, p);
        }}
      />
    </>
  );
}

// ── Org row with locations ─────────────────────────────────────────────────────
function OrgRow({ org, onEdit, onRefresh }: {
  org: Org; onEdit: (o: Org) => void; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [locDialog, setLocDialog]     = useState(false);
  const [editingLoc, setEditingLoc]   = useState<Location | null>(null);

  async function loadLocs() {
    setLoadingLocs(true);
    const locs = await apiFetch<Location[]>(`/admin/locations?org_id=${org.id}`).catch(() => []);
    setLocations(locs);
    setLoadingLocs(false);
  }

  async function expand() {
    if (!expanded && locations.length === 0) await loadLocs();
    setExpanded(e => !e);
  }

  async function openAddLoc() {
    setEditingLoc(null);
    if (locations.length === 0 && !loadingLocs) await loadLocs();
    setExpanded(true);
    setLocDialog(true);
  }

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-[#E5E7EB]">
        <td className="px-4 py-3">
          <button onClick={expand} className="flex items-center gap-2">
            {expanded ? <ChevronDown className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />}
            <div>
              <div className="font-semibold text-[#111827] text-sm">{org.name}</div>
              {org.unique_code && (
                <div className="font-mono text-[10px] text-[#9CA3AF]">{org.unique_code}</div>
              )}
            </div>
          </button>
        </td>
        <td className="px-4 py-3 text-xs text-[#6B7280]">{org.abbreviation ?? '—'}</td>
        <td className="px-4 py-3 text-xs text-[#6B7280]">{org.location_count} locations</td>
        <td className="px-4 py-3 text-xs text-[#6B7280]">{org.pss_count} sub stations</td>
        <td className="px-4 py-3 text-xs text-[#9CA3AF]">{new Date(org.created_at).toLocaleDateString('en-IN')}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(org)} className="p-1 rounded hover:bg-gray-100 text-[#6B7280]" title="Edit org">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openAddLoc()}
              className="p-1 rounded hover:bg-blue-50 text-[#2563EB]"
              title="Add location"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        loadingLocs ? (
          <tr><td colSpan={6} className="pl-10 py-2 text-xs text-[#9CA3AF]">Loading locations…</td></tr>
        ) : locations.length === 0 ? (
          <tr><td colSpan={6} className="pl-10 py-2 text-xs text-[#9CA3AF]">No locations yet — add one</td></tr>
        ) : (
          locations.map(loc => (
            <LocationRow
              key={loc.id}
              loc={loc}
              onEdit={l => { setEditingLoc(l); setLocDialog(true); }}
              onPssAdded={() => onRefresh()}
            />
          ))
        )
      )}

      <LocationDialog
        open={locDialog}
        orgId={org.id}
        editing={editingLoc}
        onClose={() => { setLocDialog(false); setEditingLoc(null); }}
        onSaved={loc => {
          setLocations(prev => editingLoc ? prev.map(x => x.id === loc.id ? { ...x, ...loc } : x) : [...prev, { ...loc, pss_count: 0 }]);
          onRefresh();
        }}
      />
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function OrganisationsPage() {
  const { user } = useAuth();
  const [orgs,    setOrgs]    = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgDialog, setOrgDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Org | null>(null);

  const load = useCallback(async () => {
    const data = await apiFetch<Org[]>('/admin/organisations').catch(() => []);
    setOrgs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <div className="p-6 text-sm text-[#6B7280]">Access restricted to Admin and above.</div>;
  }

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Organisations</h1>
          <p className="text-xs text-[#6B7280]">
            {orgs.length} org{orgs.length !== 1 ? 's' : ''} ·{' '}
            {orgs.reduce((s, o) => s + Number(o.location_count), 0)} locations ·{' '}
            {orgs.reduce((s, o) => s + Number(o.pss_count), 0)} sub stations
          </p>
        </div>
        {user.role === 'super_admin' && (
          <Button size="sm" onClick={() => { setEditingOrg(null); setOrgDialog(true); }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Organisation
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              {['Organisation', 'Abbr.', 'Locations', 'Sub Stations', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#6B7280]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[#9CA3AF]">No organisations yet</td></tr>
            )}
            {orgs.map(org => (
              <OrgRow
                key={org.id}
                org={org}
                onEdit={o => { setEditingOrg(o); setOrgDialog(true); }}
                onRefresh={load}
              />
            ))}
          </tbody>
        </table>
      </div>

      <OrgDialog
        open={orgDialog}
        editing={editingOrg}
        onClose={() => { setOrgDialog(false); setEditingOrg(null); }}
        onSaved={org => {
          setOrgs(prev => editingOrg
            ? prev.map(o => o.id === org.id ? { ...o, ...org } : o)
            : [...prev, { ...org, location_count: 0, pss_count: 0 }]
          );
        }}
      />
    </div>
  );
}
