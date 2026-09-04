'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getPresets, createPreset, updatePreset, deletePreset } from '@/lib/api';
import type { PssPreset, SldConfig } from '@/lib/api';

interface Threshold {
  id:             string;
  component_type: string;
  param_key:      string;
  warn_value:     number;
  crit_value:     number;
  unit:           string;
  is_current:     boolean;
}
interface Me { role: string; }

const LABELS: Record<string, string> = {
  oil_temp_warn: 'Oil Temp Warning', oil_temp_crit: 'Oil Temp Critical',
  wind_temp_warn: 'Winding Temp Warning', wind_temp_crit: 'Winding Temp Critical',
  pf_min: 'Min Power Factor', load_pct_warn: 'Load % Warning',
  load_pct_crit: 'Load % Critical', ht_oc_warn: 'HT Overcurrent Warning',
  ht_oc_crit: 'HT Overcurrent Critical',
};

const CFG_LABELS: Record<keyof SldConfig, string> = {
  has_acb2:     'DG / Alternate Source (ACB-2)',
  has_apfc:     'APFC Panel',
  has_oltc:     'OLTC on Transformer',
  has_buchholz: 'Buchholz Relay',
  has_mfm2b:    'Secondary Bus Metering (MFM-2B)',
  feeder_count: 'Number of MCCB Feeders',
};

const DEFAULT_CFG: Required<SldConfig> = {
  has_acb2: false, has_apfc: false, has_oltc: false,
  has_buchholz: false, has_mfm2b: false, feeder_count: 4,
};

function PresetDialog({ preset, onClose, onSave }: {
  preset: Partial<PssPreset> | null;
  onClose: () => void;
  onSave: (p: Partial<PssPreset>) => Promise<void>;
}) {
  const [name, setName]   = useState(preset?.name ?? '');
  const [desc, setDesc]   = useState(preset?.description ?? '');
  const [cfg, setCfg]     = useState<Required<SldConfig>>({ ...DEFAULT_CFG, ...(preset?.config ?? {}) });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  async function submit() {
    if (!name.trim()) { setErr('Name is required'); return; }
    setSaving(true); setErr('');
    try {
      await onSave({ name: name.trim(), description: desc.trim() || null, config: cfg });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <span className="font-semibold text-sm text-[#111827]">
            {preset?.id ? 'Edit Preset' : 'New Preset'}
          </span>
          <button onClick={onClose}><X className="w-4 h-4 text-[#6B7280]"/></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-[#374151]">Preset Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard 11kV (4-feeder)"
              className="mt-1 w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"/>
          </div>
          <div>
            <label className="text-xs font-medium text-[#374151]">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description"
              className="mt-1 w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"/>
          </div>
          <div>
            <label className="text-xs font-medium text-[#374151] mb-2 block">SLD Components</label>
            <div className="space-y-2 border border-[#E5E7EB] rounded-lg p-3 bg-[#F9FAFB]">
              {(Object.keys(DEFAULT_CFG) as (keyof SldConfig)[]).map(key => (
                <div key={key} className="flex items-center gap-3">
                  {key === 'feeder_count' ? (
                    <>
                      <span className="text-xs text-[#374151] flex-1">{CFG_LABELS[key]}</span>
                      <select
                        value={cfg.feeder_count}
                        onChange={e => setCfg(c => ({ ...c, feeder_count: +e.target.value }))}
                        className="border border-[#D1D5DB] rounded px-2 py-1 text-xs">
                        {[2,4,6,8,10,12,16,20,24,32].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <input type="checkbox"
                        checked={!!cfg[key]}
                        onChange={e => setCfg(c => ({ ...c, [key]: e.target.checked }))}
                        className="rounded"/>
                      <span className="text-xs text-[#374151]">{CFG_LABELS[key]}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="px-5 py-3 border-t border-[#E5E7EB] flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-[#374151] hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50">
            {saving ? 'Saving…' : <><Check className="w-3.5 h-3.5"/> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [rows,    setRows]    = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [me,      setMe]      = useState<Me | null>(null);

  // Presets state
  const [presets,     setPresets]     = useState<PssPreset[]>([]);
  const [presLoading, setPresLoading] = useState(true);
  const [dialog,      setDialog]      = useState<{ open: boolean; preset: Partial<PssPreset> | null }>({ open: false, preset: null });

  const isSuperAdmin = me?.role === 'super_admin';

  useEffect(() => {
    apiFetch<Threshold[]>('/admin/thresholds')
      .then(data => setRows(data.filter(r => r.is_current)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    apiFetch<Me>('/me').then(setMe).catch(() => {});
  }, []);

  const loadPresets = useCallback(() => {
    setPresLoading(true);
    getPresets().then(setPresets).catch(() => {}).finally(() => setPresLoading(false));
  }, []);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  async function handleSave(data: Partial<PssPreset>) {
    if (dialog.preset?.id) {
      await updatePreset(dialog.preset.id, data);
    } else {
      await createPreset(data as Omit<PssPreset,'id'|'created_by_name'|'created_at'|'updated_at'>);
    }
    loadPresets();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete preset "${name}"? PSS units using it will be detached.`)) return;
    await deletePreset(id);
    loadPresets();
  }

  const grouped = rows.reduce<Record<string, Threshold[]>>((acc, r) => {
    (acc[r.component_type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[#111827]">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">Alert thresholds and PSS configuration presets.</p>
      </div>

      {loading && <p className="text-sm text-[#6B7280]">Loading…</p>}
      {error   && <p className="text-sm text-red-500">{error}</p>}

      {/* Thresholds */}
      {!loading && !error && Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wide">{type.replace(/_/g, ' ')}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-2 text-xs text-[#6B7280] font-medium">Parameter</th>
                <th className="text-right px-4 py-2 text-xs text-[#6B7280] font-medium">Warning</th>
                <th className="text-right px-4 py-2 text-xs text-[#6B7280] font-medium">Critical</th>
                <th className="text-right px-4 py-2 text-xs text-[#6B7280] font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-b border-[#F3F4F6] last:border-0">
                  <td className="px-4 py-2.5 text-[#111827]">{LABELS[r.param_key] ?? r.param_key}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#D97706]">{r.warn_value}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[#DC2626]">{r.crit_value}</td>
                  <td className="px-4 py-2.5 text-right text-[#6B7280]">{r.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* PSS Presets */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#374151] uppercase tracking-wide">PSS Presets</span>
            {!isSuperAdmin && (
              <span className="ml-2 text-xs text-[#6B7280]">· read-only (super admin edits)</span>
            )}
          </div>
          {isSuperAdmin && (
            <button onClick={() => setDialog({ open: true, preset: null })}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8]">
              <Plus className="w-3 h-3"/> New Preset
            </button>
          )}
        </div>

        {presLoading ? (
          <div className="px-4 py-6 text-sm text-[#6B7280]">Loading presets…</div>
        ) : presets.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[#6B7280]">No presets yet.</div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {presets.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#111827]">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-[#6B7280] mt-0.5">{p.description}</div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(Object.entries(p.config) as [keyof SldConfig, unknown][])
                      .filter(([k, v]) => k !== 'feeder_count' && v)
                      .map(([k]) => (
                        <span key={k}
                          className="px-1.5 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-medium rounded">
                          {CFG_LABELS[k]}
                        </span>
                      ))}
                    <span className="px-1.5 py-0.5 bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-medium rounded">
                      {p.config.feeder_count ?? 4} feeders
                    </span>
                  </div>
                </div>
                {isSuperAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button onClick={() => setDialog({ open: true, preset: p })}
                      className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded">
                      <Pencil className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
        <div className="text-sm font-semibold text-[#111827] mb-1">Notification Preferences</div>
        <p className="text-xs text-[#6B7280]">Email and SMS alerting configuration — coming in Phase 4.</p>
      </div>

      {dialog.open && (
        <PresetDialog
          preset={dialog.preset}
          onClose={() => setDialog({ open: false, preset: null })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
