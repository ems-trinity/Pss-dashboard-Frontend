'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_THRESHOLDS } from '@/lib/api';
import type { Thresholds, ThresholdValues, Pss } from '@/types';

interface Props {
  pss:        Pss[];
  thresholds: Thresholds;
  onSave:     (t: Thresholds) => Promise<void>;
  readOnly?:  boolean;
}

const FIELDS: [keyof ThresholdValues, string, number, number, number][] = [
  ['oilTempWarn',  'Oil Temp Warn (°C)',     0.01, 50,  100],
  ['oilTempCrit',  'Oil Temp Critical (°C)', 0.01, 50,  120],
  ['windTempWarn', 'Winding Warn (°C)',       0.01, 60,  130],
  ['windTempCrit', 'Winding Critical (°C)',   0.01, 60,  150],
  ['pfMin',        'PF Minimum',              0.01, 0.8, 0.99],
  ['loadPctWarn',  'Load Warn (%)',           1,    50,  100],
  ['loadPctCrit',  'Load Critical (%)',       1,    50,  100],
];

export function ThresholdConfig({ pss, thresholds, onSave, readOnly = false }: Props) {
  const [draft,    setDraft]    = useState<Thresholds>(thresholds);
  const [selected, setSelected] = useState<string>('global');
  const [saving,   setSaving]   = useState(false);
  const [flash,    setFlash]    = useState(false);

  useEffect(() => {
    if (thresholds?.global) setDraft(thresholds);
  }, [thresholds]);

  const isGlobal = selected === 'global';
  const T: ThresholdValues = isGlobal
    ? { ...DEFAULT_THRESHOLDS, ...(draft.global ?? {}) }
    : { ...DEFAULT_THRESHOLDS, ...(draft.global ?? {}), ...(draft.perUnit?.[selected] ?? {}) };

  function setVal(key: keyof ThresholdValues, val: number) {
    if (isGlobal) {
      setDraft(d => ({ ...d, global: { ...(d.global ?? {}), [key]: val } }));
    } else {
      setDraft(d => ({
        ...d,
        perUnit: {
          ...(d.perUnit ?? {}),
          [selected]: { ...(d.perUnit?.[selected] ?? {}), [key]: val },
        },
      }));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Scope selector */}
      <div className="w-48 border-r border-[#E5E7EB] p-3 space-y-1 overflow-y-auto flex-shrink-0">
        <button
          onClick={() => setSelected('global')}
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
            selected === 'global'
              ? 'bg-blue-50 text-[#2563EB] font-medium'
              : 'text-[#6B7280] hover:bg-gray-50'
          }`}
        >
          Global defaults
        </button>
        {pss.map(u => (
          <button
            key={u.id}
            onClick={() => setSelected(u.id)}
            className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
              selected === u.id
                ? 'bg-blue-50 text-[#2563EB] font-medium'
                : 'text-[#6B7280] hover:bg-gray-50'
            }`}
          >
            {u.code}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-lg space-y-4">
          <div className="text-sm font-semibold text-[#111827]">
            {isGlobal ? 'Global Defaults' : pss.find(p => p.id === selected)?.code}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(([key, label, step, min, max]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide block">
                  {label}
                </label>
                <Input
                  type="number"
                  step={step}
                  min={min}
                  max={max}
                  value={T[key]}
                  onChange={e => !readOnly && setVal(key, parseFloat(e.target.value))}
                  readOnly={readOnly}
                  className={readOnly ? 'bg-gray-50 cursor-default' : ''}
                />
              </div>
            ))}
          </div>
          {readOnly ? (
            <p className="text-xs text-[#9CA3AF] pt-2">
              Read-only — only Super Admin can modify thresholds.
            </p>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save thresholds'}
              </Button>
              {flash && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
