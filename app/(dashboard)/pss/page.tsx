'use client';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { usePss } from '@/hooks/use-pss';
import { useAuth } from '@/hooks/use-auth';
import { PssCard } from '@/components/monitoring/pss-card';
import { StatusPie } from '@/components/monitoring/status-pie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';

type OrgOption = { id: string; name: string; abbreviation: string | null };
type LocOption = { id: string; unique_code: string; display_name: string | null; grid_supply_voltage: string };
type NewPss    = { location_id: string; kva_rating: string; ht_voltage_class: string; manufacturer_serial: string };

const VOLTAGE_OPTS = ['33kV', '22kV', '11kV'];
const KVA_OPTS = [250, 500, 1000, 1500, 2000, 2500, 3150, 4000, 5000];

function AddPssDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [orgs,    setOrgs]    = useState<OrgOption[]>([]);
  const [locs,    setLocs]    = useState<LocOption[]>([]);
  const [orgId,   setOrgId]   = useState('');
  const [form,    setForm]    = useState<NewPss>({ location_id: '', kva_rating: '1000', ht_voltage_class: '33kV', manufacturer_serial: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [preview, setPreview] = useState('');

  // Load orgs on open
  useEffect(() => {
    if (!open) return;
    setError(''); setPreview('');
    setForm({ location_id: '', kva_rating: '1000', ht_voltage_class: '33kV', manufacturer_serial: '' });

    if (isSuperAdmin) {
      apiFetch<OrgOption[]>('/admin/users/org-options').then(setOrgs).catch(() => {});
      setOrgId('');
    } else {
      // Admin: use their own org, load locations directly
      setOrgId(user?.orgId ?? '');
    }
  }, [open, isSuperAdmin, user?.orgId]);

  // Load locations when orgId changes
  useEffect(() => {
    if (!orgId) { setLocs([]); return; }
    apiFetch<LocOption[]>(`/admin/locations?org_id=${orgId}`).then(locs => {
      setLocs(locs);
      setForm(f => ({ ...f, location_id: locs[0]?.id ?? '' }));
    }).catch(() => {});
  }, [orgId]);

  // Preview code when location selected
  useEffect(() => {
    const loc = locs.find(l => l.id === form.location_id);
    if (loc) setPreview(`${loc.unique_code}XX`);
    else setPreview('');
  }, [form.location_id, locs]);

  async function save() {
    if (!form.location_id) { setError('Select a location'); return; }
    setSaving(true); setError('');
    try {
      await apiFetch('/admin/pss-units', {
        method: 'POST',
        body: JSON.stringify({
          location_id: form.location_id,
          kva_rating: parseInt(form.kva_rating),
          ht_voltage_class: form.ht_voltage_class,
          manufacturer_serial: form.manufacturer_serial || null,
        }),
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sub Station</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* Org selector (super_admin only) */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <Label>Organisation <span className="text-red-500">*</span></Label>
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                value={orgId}
                onChange={e => { setOrgId(e.target.value); setForm(f => ({ ...f, location_id: '' })); }}
              >
                <option value="">— select org —</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}

          {/* Location selector */}
          <div className="space-y-1">
            <Label>Location <span className="text-red-500">*</span></Label>
            {locs.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] py-1">
                {orgId ? 'No locations in this org — add one from Organisations first.' : 'Select an org first.'}
              </p>
            ) : (
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                value={form.location_id}
                onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
              >
                <option value="">— select location —</option>
                {locs.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.unique_code}{l.display_name ? ` — ${l.display_name}` : ''} ({l.grid_supply_voltage})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Voltage + kVA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>HT Voltage <span className="text-red-500">*</span></Label>
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                value={form.ht_voltage_class}
                onChange={e => setForm(f => ({ ...f, ht_voltage_class: e.target.value }))}
              >
                {VOLTAGE_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Rating (kVA) <span className="text-red-500">*</span></Label>
              <select
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                value={form.kva_rating}
                onChange={e => setForm(f => ({ ...f, kva_rating: e.target.value }))}
              >
                {KVA_OPTS.map(k => <option key={k} value={k}>{k} kVA</option>)}
              </select>
            </div>
          </div>

          {/* Serial */}
          <div className="space-y-1">
            <Label>Manufacturer Serial</Label>
            <Input
              value={form.manufacturer_serial}
              onChange={e => setForm(f => ({ ...f, manufacturer_serial: e.target.value }))}
              placeholder="MFR-2024-XXXXX"
            />
          </div>

          {/* Code preview */}
          {preview && (
            <div className="bg-[#F3F4F6] rounded-lg px-3 py-2 text-xs text-[#6B7280]">
              Unit code will be assigned as{' '}
              <span className="font-mono font-semibold text-[#2563EB]">{preview}</span>{' '}
              (next available in this location)
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.location_id}>
            {saving ? 'Creating…' : 'Create Sub Station'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PssListPage() {
  const { pss, loading, error, refresh } = usePss();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const canAdd = user?.role === 'admin' || user?.role === 'super_admin';

  if (loading) return <div className="p-6 text-sm text-[#6B7280]">Loading sub stations…</div>;
  if (error)   return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">Sub Stations</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {pss.length} unit{pss.length !== 1 ? 's' : ''} monitored — select a unit to view its dashboard
          </p>
        </div>
        {canAdd && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Sub Station
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pss.map(unit => <PssCard key={unit.id} unit={unit} />)}
            {pss.length === 0 && (
              <div className="col-span-3 text-sm text-[#9CA3AF] text-center py-12">No sub stations found</div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="text-sm font-semibold text-[#111827] mb-3">Status Distribution</div>
          <StatusPie pss={pss} />
        </div>
      </div>

      <AddPssDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => refresh()}
      />
    </div>
  );
}
