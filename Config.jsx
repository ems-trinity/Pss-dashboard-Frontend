// Config.jsx — Per-PSS threshold configuration
const { useState } = React;

// Exported so App.jsx can seed initial thresholds state
window.DEFAULT_THRESHOLDS = {
  oilTempWarn:  70,   // °C
  oilTempCrit:  85,   // °C
  windTempWarn: 85,   // °C
  windTempCrit: 100,  // °C
  pfMin:        0.92,
  loadPctWarn:  85,   // % of rated kVA
  loadPctCrit:  95,   // % of rated kVA
};

// ── Threshold colour bar ──────────────────────────────────────────────────────
function ThreshBar({ warn, crit, min, max, suffix = '' }) {
  const wPct = Math.max(0, Math.min(100, Math.round(((warn - min) / (max - min)) * 100)));
  const cPct = Math.max(0, Math.min(100, Math.round(((crit - min) / (max - min)) * 100)));
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        height: 8, borderRadius: 4, overflow: 'hidden',
        background: `linear-gradient(to right,
          #DCFCE7 0% ${wPct}%,
          #FEF3C7 ${wPct}% ${cPct}%,
          #FEE2E2 ${cPct}% 100%)`,
      }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 5, fontSize: 10, color: BRAND.textMut,
      }}>
        <span>{min}{suffix}</span>
        <span style={{ color: '#D97706', fontWeight: 600 }}>{warn}{suffix} warn</span>
        <span style={{ color: '#DC2626', fontWeight: 600 }}>{crit}{suffix} crit</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

// ── Single threshold number field ─────────────────────────────────────────────
function ThreshField({ label, value, onChange, unit, min, max, step, dotColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: BRAND.textSec,
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={e => onChange(+e.target.value)}
          style={{
            width: 86, padding: '7px 10px', textAlign: 'right',
            border: `1px solid ${BRAND.border}`, borderRadius: 8,
            fontSize: 13, color: BRAND.text, background: '#FFFFFF',
            fontFamily: 'inherit', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = BRAND.blue;
            e.target.style.boxShadow   = '0 0 0 3px rgba(27,77,181,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = BRAND.border;
            e.target.style.boxShadow   = 'none';
          }}
        />
        {unit && <span style={{ fontSize: 12, color: BRAND.textSec }}>{unit}</span>}
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: dotColor, flexShrink: 0,
        }} />
      </div>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function ThreshSection({ icon, iconColor, title, children }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Ic name={icon} size={15} color={iconColor} />
        <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.text }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Scope sidebar button ──────────────────────────────────────────────────────
function ScopeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '9px 16px',
      background: active ? '#EFF6FF' : 'transparent',
      border: 'none',
      borderLeft: active ? `3px solid ${BRAND.blue}` : '3px solid transparent',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
      transition: 'background 0.1s', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  );
}

// ── Main Config component ─────────────────────────────────────────────────────
function Config({ pss, thresholds, onSave }) {
  const [selected,   setSelected]   = useState('global');
  const [draft,      setDraft]      = useState(thresholds);
  const [saveFlash,  setSaveFlash]  = useState(false);

  // Sync draft when live thresholds load from API after mount
  React.useEffect(() => {
    if (thresholds?.global) setDraft(thresholds);
  }, [thresholds]);

  const isGlobal = selected === 'global';
  const unit     = pss.find(p => p.id === selected);

  // Effective values for the current scope — always fall back to DEFAULT_THRESHOLDS
  const T = isGlobal
    ? { ...window.DEFAULT_THRESHOLDS, ...(draft.global ?? {}) }
    : { ...window.DEFAULT_THRESHOLDS, ...(draft.global ?? {}), ...(draft.perUnit?.[selected] ?? {}) };

  const hasOverrides = !isGlobal && Object.keys(draft.perUnit?.[selected] ?? {}).length > 0;

  function setVal(key, val) {
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

  function resetUnit() {
    setDraft(d => ({ ...d, perUnit: { ...(d.perUnit ?? {}), [selected]: {} } }));
  }

  function handleSave() {
    onSave(draft);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ── Left: scope selector ─────────────────────────────────────── */}
      <div style={{
        width: 224, flexShrink: 0,
        borderRight: `1px solid ${BRAND.border}`,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', background: '#FAFBFD',
      }}>
        <div style={{
          padding: '11px 16px', borderBottom: `1px solid ${BRAND.border}`,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: BRAND.textMut,
        }}>
          Scope
        </div>

        <ScopeBtn active={selected === 'global'} onClick={() => setSelected('global')}>
          <Ic name="settings" size={13} color={selected === 'global' ? BRAND.blue : BRAND.textSec} />
          <span style={{
            fontSize: 13, fontWeight: selected === 'global' ? 600 : 400,
            color: selected === 'global' ? BRAND.blue : BRAND.text,
          }}>
            Global Defaults
          </span>
        </ScopeBtn>

        <div style={{
          padding: '8px 16px 3px', marginTop: 6,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: BRAND.textMut,
        }}>
          Per-Unit Override
        </div>

        {pss.map(u => {
          const active  = selected === u.id;
          const hasOvr  = Object.keys(draft.perUnit[u.id] || {}).length > 0;
          return (
            <ScopeBtn key={u.id} active={active} onClick={() => setSelected(u.id)}>
              <StatusDot status={u.status} size={6} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? BRAND.blue : BRAND.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {u.code}
                </div>
                <div style={{ fontSize: 10, color: BRAND.textSec }}>{u.loc}</div>
              </div>
              {hasOvr && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: BRAND.blue, flexShrink: 0,
                }} title="Has overrides" />
              )}
            </ScopeBtn>
          );
        })}
      </div>

      {/* ── Right: editor ────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ maxWidth: 600 }}>

          {/* Page header */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 22, gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.text }}>
                {isGlobal ? 'Global Defaults' : (unit?.code || '—')}
              </div>
              <div style={{ fontSize: 12, color: BRAND.textSec, marginTop: 2 }}>
                {isGlobal
                  ? 'Applied to all PSS units unless a unit-level override is set'
                  : hasOverrides
                    ? `Custom thresholds active for ${unit?.loc}`
                    : `Inheriting global defaults — any edit creates a unit override`
                }
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!isGlobal && hasOverrides && (
                <button className="btn-ghost" onClick={resetUnit} style={{ fontSize: 12, padding: '7px 12px' }}>
                  Reset to Global
                </button>
              )}
              <button className="btn-primary" onClick={handleSave} style={{ minWidth: 88 }}>
                {saveFlash
                  ? <><Ic name="check" size={13} color="#fff" /> Saved</>
                  : <><Ic name="check" size={13} color="#fff" /> Save</>
                }
              </button>
            </div>
          </div>

          {/* Oil Temperature */}
          <ThreshSection icon="thermo" iconColor="#D97706" title="Oil Temperature">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ThreshField label="Warning level" value={T.oilTempWarn} unit="°C"
                min={35} max={T.oilTempCrit - 1} step={1} dotColor="#D97706"
                onChange={v => setVal('oilTempWarn', v)} />
              <ThreshField label="Critical level" value={T.oilTempCrit} unit="°C"
                min={T.oilTempWarn + 1} max={120} step={1} dotColor="#DC2626"
                onChange={v => setVal('oilTempCrit', v)} />
            </div>
            <ThreshBar warn={T.oilTempWarn} crit={T.oilTempCrit} min={0} max={120} suffix="°C" />
          </ThreshSection>

          {/* Winding Temperature */}
          <ThreshSection icon="thermo" iconColor="#DC2626" title="Winding Temperature">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ThreshField label="Warning level" value={T.windTempWarn} unit="°C"
                min={50} max={T.windTempCrit - 1} step={1} dotColor="#D97706"
                onChange={v => setVal('windTempWarn', v)} />
              <ThreshField label="Critical level" value={T.windTempCrit} unit="°C"
                min={T.windTempWarn + 1} max={150} step={1} dotColor="#DC2626"
                onChange={v => setVal('windTempCrit', v)} />
            </div>
            <ThreshBar warn={T.windTempWarn} crit={T.windTempCrit} min={0} max={150} suffix="°C" />
          </ThreshSection>

          {/* Power Factor */}
          <ThreshSection icon="zap" iconColor={BRAND.blue} title="Power Factor">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ThreshField label="Minimum acceptable" value={T.pfMin} unit=""
                min={0.70} max={0.99} step={0.01} dotColor="#D97706"
                onChange={v => setVal('pfMin', v)} />
              <div style={{
                padding: '10px 13px', background: '#F8FAFC',
                borderRadius: 8, border: `1px solid ${BRAND.border}`,
              }}>
                <div style={{ fontSize: 11, color: BRAND.textSec, marginBottom: 6 }}>Alarm logic</div>
                <div style={{ fontSize: 12, color: BRAND.text }}>
                  PF &lt; <span style={{ fontWeight: 700 }}>{T.pfMin.toFixed(2)}</span> → Warning
                </div>
                <div style={{ fontSize: 11, color: BRAND.textSec, marginTop: 3 }}>
                  No critical threshold for PF
                </div>
              </div>
            </div>
          </ThreshSection>

          {/* Load */}
          <ThreshSection icon="activity" iconColor={BRAND.blue} title="Load Level — % of rated kVA">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ThreshField label="Warning level" value={T.loadPctWarn} unit="%"
                min={50} max={T.loadPctCrit - 1} step={1} dotColor="#D97706"
                onChange={v => setVal('loadPctWarn', v)} />
              <ThreshField label="Critical level" value={T.loadPctCrit} unit="%"
                min={T.loadPctWarn + 1} max={100} step={1} dotColor="#DC2626"
                onChange={v => setVal('loadPctCrit', v)} />
            </div>
            <ThreshBar warn={T.loadPctWarn} crit={T.loadPctCrit} min={0} max={100} suffix="%" />
          </ThreshSection>

        </div>
      </div>
    </div>
  );
}

window.Config = Config;
