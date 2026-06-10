// PssDetail.jsx — 3-column PSS detail page
const { useState } = React;

// ── Component List (left panel) ────────────────────────────────────────────
function ComponentList({ components, selectedComp, onSelect }) {
  const typeOrder = ['HT_VCB','HT_Feeder','TRANSFORMER','LT_ACB','LT_FEEDER','LT_outgoing','APFC'];
  const sorted = [...components].sort((a,b) => typeOrder.indexOf(a.type)-typeOrder.indexOf(b.type));

  function CompRow({ c }) {
    const sel  = selectedComp === c.id;
    const scfg = STATUS[c.status] || STATUS.normal;
    const isMeter  = c.type === 'HT_Feeder' || c.type === 'LT_FEEDER';
    const isBreaker = c.type === 'HT_VCB' || c.type === 'LT_ACB';
    const isTrf    = c.type === 'TRANSFORMER';
    const isOut    = c.type === 'LT_outgoing';
    const isApfc   = c.type === 'APFC';
    const bgTrip   = c.tripped ? 'rgba(220,38,38,0.04)' : undefined;

    return (
      <div onClick={() => onSelect(sel ? null : c.id)} style={{
        padding:'10px 14px', cursor:'pointer', transition:'background 0.12s',
        background: sel ? '#EFF6FF' : bgTrip,
        borderLeft: sel ? `3px solid ${BRAND.blue}` : '3px solid transparent',
        borderBottom: `1px solid ${BRAND.border}`,
      }}
        onMouseEnter={e => { if (!sel) e.currentTarget.style.background='#F8FAFC'; }}
        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = bgTrip||''; }}
      >
        {/* Title row */}
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
          <StatusDot status={c.status} size={7}/>
          <span style={{ fontSize:12, fontWeight:600, color: sel?BRAND.blue:BRAND.text, flex:1 }}>{c.label}</span>
          <span style={{ fontSize:9, fontWeight:600, color: BRAND.textMut, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.type.replace('_',' ')}</span>
        </div>

        {/* Metrics */}
        {isBreaker && (
          <div style={{ display:'flex', gap:12 }} className="mono">
            <span style={{ fontSize:11, fontWeight:700, color: c.tripped?STATUS.critical.color:STATUS.normal.color }}>
              {c.tripped ? '⚡ TRIPPED' : 'CLOSED'}
            </span>
            <span style={{ fontSize:10, color: BRAND.textMut }}>Spring: {c.spring?'Ready':'—'}</span>
            <span style={{ fontSize:10, color: c.relay?BRAND.textMut:STATUS.critical.color }}>Relay: {c.relay?'OK':'Fault'}</span>
          </div>
        )}
        {isMeter && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
            <span className="mono" style={{ fontSize:11, color: BRAND.text }}>{(c.v/1000).toFixed(1)} kV</span>
            <span className="mono" style={{ fontSize:11, color: BRAND.text }}>{c.a?.toFixed(1)} A</span>
            <span className="mono" style={{ fontSize:11, fontWeight:600, color: BRAND.blue }}>{c.kw?.toLocaleString('en-IN')} kW</span>
            <span className="mono" style={{ fontSize:10, color: BRAND.textSec }}>PF {c.pf?.toFixed(2)}</span>
            {c.hz && <span className="mono" style={{ fontSize:10, color: BRAND.textSec }}>{c.hz} Hz</span>}
            {c.kvar && <span className="mono" style={{ fontSize:10, color: BRAND.textSec }}>{c.kvar} kVAR</span>}
          </div>
        )}
        {isTrf && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
            <span className="mono" style={{ fontSize:11, color: c.oilT>=85?STATUS.critical.color:c.oilT>=70?STATUS.warning.color:BRAND.text }}>Oil {c.oilT}°C</span>
            <span className="mono" style={{ fontSize:11, color: c.windT>=120?STATUS.critical.color:c.windT>=100?STATUS.warning.color:BRAND.text }}>Wind {c.windT}°C</span>
            <span className="mono" style={{ fontSize:10, color: BRAND.textSec }}>Tap: {c.oltc>=0?`+${c.oltc}`:c.oltc}</span>
            {c.buch && <span style={{ fontSize:10, fontWeight:600, color:STATUS.warning.color }}>⚠ Buchholz</span>}
          </div>
        )}
        {isOut && (
          <div style={{ display:'flex', gap:14 }}>
            <span className="mono" style={{ fontSize:12, fontWeight:700, color: BRAND.text }}>{c.kw} kW</span>
            <span className="mono" style={{ fontSize:11, color: BRAND.textSec }}>{c.a} A</span>
          </div>
        )}
        {isApfc && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
            <span className="mono" style={{ fontSize:11, fontWeight:700, color: c.corrPf>=0.95?STATUS.normal.color:c.corrPf>=0.9?STATUS.warning.color:STATUS.critical.color }}>PF {c.corrPf?.toFixed(2)}</span>
            <span className="mono" style={{ fontSize:11, color: BRAND.textSec }}>{c.connKvar} / {c.reqKvar} kVAR</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ padding:'12px 14px 10px', borderBottom:`1px solid ${BRAND.border}`, flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: BRAND.textMut }}>
          Components
        </span>
        <span style={{ marginLeft:8, fontSize:10, color: BRAND.textMut }}>({sorted.length})</span>
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {sorted.map(c => <CompRow key={c.id} c={c}/>)}
      </div>
    </div>
  );
}

// ── Active Faults ──────────────────────────────────────────────────────────
function ActiveFaults({ faults }) {
  const active = faults.filter(f => f.fStatus === 'active');

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      <div style={{
        padding:'12px 14px 10px', borderBottom:`1px solid ${BRAND.border}`,
        display:'flex', alignItems:'center', gap:8, flexShrink:0,
      }}>
        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: BRAND.textMut }}>Active Faults</span>
        {active.length > 0 && (
          <span style={{
            background:STATUS.critical.bg, color:STATUS.critical.color,
            border:`1px solid ${STATUS.critical.border}`, borderRadius:99,
            fontSize:10, fontWeight:700, padding:'1px 6px',
          }}>{active.length}</span>
        )}
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {active.length === 0
          ? <EmptyState icon="checkCirc" title="All systems normal" sub="No active faults detected" color="#16A34A"/>
          : active.map(f => (
            <div key={f.id} style={{
              padding:'12px 14px',
              borderBottom:`1px solid ${BRAND.border}`,
              borderLeft:`3px solid ${f.sev==='critical'?STATUS.critical.color:STATUS.warning.color}`,
              background: f.sev==='critical'?'rgba(220,38,38,0.02)':'rgba(217,119,6,0.02)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <SeverityBadge sev={f.sev}/>
                <span style={{ fontSize:10, color: BRAND.textMut }} className="mono">{fmt.timeAgo(f.at)}</span>
              </div>
              <p style={{ fontSize:12, color: BRAND.text, lineHeight:1.5, margin:'0 0 4px' }}>{f.msg}</p>
              <span style={{ fontSize:10, fontWeight:600, color: BRAND.textSec, textTransform:'uppercase', letterSpacing:'0.05em' }}>{f.comp}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── APFC Panel ─────────────────────────────────────────────────────────────
function ApfcPanel({ apfc }) {
  if (!apfc) return null;
  const pct = Math.min(100, Math.round((apfc.connKvar / apfc.reqKvar) * 100));
  const pfColor = apfc.corrPf >= 0.95 ? '#16A34A' : apfc.corrPf >= 0.9 ? '#D97706' : '#DC2626';
  const barColor = pct >= 95 ? '#16A34A' : '#D97706';

  return (
    <div style={{ padding:'12px 14px 14px', borderTop:`1px solid ${BRAND.border}` }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: BRAND.textMut, marginBottom:12 }}>
        Power Factor Correction
      </div>

      {/* Current PF */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:12 }}>
        <span className="mono" style={{ fontSize:28, fontWeight:700, color: pfColor, lineHeight:1 }}>
          {apfc.corrPf?.toFixed(3)}
        </span>
        <div style={{ marginBottom:3 }}>
          <div style={{ fontSize:9, fontWeight:600, textTransform:'uppercase', color: BRAND.textMut }}>Corrected PF</div>
          <div style={{ fontSize:10, color: BRAND.textSec }}>Target: {apfc.targetPf?.toFixed(2)}</div>
        </div>
      </div>

      {/* kVAR balance */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ fontSize:11, color: BRAND.textSec }}>
          <span style={{ fontWeight:600, color: BRAND.text }} className="mono">{apfc.connKvar}</span>
          <span style={{ marginLeft:3, color: BRAND.textMut }}>kVAR connected</span>
        </div>
        <div style={{ fontSize:11, color: BRAND.textSec }}>
          <span style={{ fontWeight:600, color: BRAND.text }} className="mono">{apfc.reqKvar}</span>
          <span style={{ marginLeft:3, color: BRAND.textMut }}>kVAR required</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:'#F1F5F9', borderRadius:99, height:8, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:barColor, borderRadius:99, transition:'width 0.4s' }}/>
      </div>
      <div style={{ marginTop:4, fontSize:10, color: BRAND.textMut, textAlign:'right' }}>{pct}% capacity utilised</div>
    </div>
  );
}

// ── Shutoff Modal ──────────────────────────────────────────────────────────
function ShutoffModal({ pss, onClose }) {
  const [reason, setReason]    = useState('');
  const [ack, setAck]          = useState(false);
  const [submitted, setSubmit] = useState(false);

  if (submitted) return (
    <Modal title="Shutoff Requested" onClose={onClose}>
      <div style={{ textAlign:'center', padding:'16px 0' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'#DCFCE7', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ic name="check" size={22} color="#16A34A"/>
        </div>
        <p style={{ fontWeight:600, color: BRAND.text, marginBottom:6 }}>Shutoff request submitted</p>
        <p style={{ fontSize:13, color: BRAND.textSec }}>A technician will be dispatched to de-energise {pss.code}. Manual re-energisation will be required on-site.</p>
        <button className="btn-primary" onClick={onClose} style={{ marginTop:20, width:'100%', justifyContent:'center' }}>Close</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="Request Remote Shutoff" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ background:'#FEF3C7', border:'1px solid #FCD34D', borderRadius:8, padding:'12px 14px', display:'flex', gap:10 }}>
          <Ic name="alert" size={16} color="#D97706" style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:13, color:'#92400E', lineHeight:1.5 }}>
            <strong>This will de-energise {pss.code}.</strong> All EV charging at {pss.loc} will stop immediately. A technician must attend on-site to re-energise the unit.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:12, fontWeight:600, color: BRAND.textSec }}>Reason for shutoff <span style={{ color:'#DC2626' }}>*</span></label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Emergency maintenance — transformer oil leak detected…"
            rows={3} style={{ resize:'vertical', fontSize:13 }}
          />
        </div>

        <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:13 }}>
          <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} style={{ width:'auto', marginTop:2 }}/>
          <span style={{ color: BRAND.textSec, lineHeight:1.5 }}>
            I understand that a qualified technician is required to re-energise the PSS after shutoff.
          </span>
        </label>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button
            className="btn-danger" disabled={!reason.trim() || !ack}
            onClick={() => setSubmit(true)}
            style={{ flex:1, justifyContent:'center' }}
          >
            <Ic name="zap" size={14}/>
            Confirm Shutoff
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── PSS Detail page ────────────────────────────────────────────────────────
function PssDetail({ pssId, pss, detail, onNav, userRole }) {
  const [selComp, setSelComp]       = useState(null);
  const [showShutoff, setShutoff]   = useState(false);

  const unit   = pss.find(p => p.id === pssId);
  const d      = detail[pssId];
  const apfc   = d?.components.find(c => c.type === 'APFC');

  if (!unit) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <EmptyState icon="alertCirc" title="PSS not found" sub="Select a unit from the sidebar" color={BRAND.textMut}/>
    </div>
  );

  if (!d) return (
    <div style={{ flex:1, display:'grid', gridTemplateColumns:'300px 1fr 300px', gap:0, overflow:'hidden' }}>
      {[1,2,3].map(i => <div key={i} style={{ padding:16, borderRight:`1px solid ${BRAND.border}` }}><SkeletonCard/><SkeletonCard/></div>)}
    </div>
  );

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Left: Component list */}
      <div style={{
        width:300, flexShrink:0, borderRight:`1px solid ${BRAND.border}`,
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Unit header */}
        <div style={{ padding:'12px 14px', borderBottom:`1px solid ${BRAND.border}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <StatusBadge status={d.status}/>
            <span className="mono" style={{ fontSize:11, color: BRAND.textMut }}>{fmt.timeAgo(d.seen)}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color: BRAND.text }}>{unit.code}</div>
          <div style={{ fontSize:11, color: BRAND.textSec, marginTop:1 }}>{unit.loc} · {unit.kva.toLocaleString()} kVA · {unit.ht}</div>
        </div>
        <ComponentList components={d.components} selectedComp={selComp} onSelect={setSelComp}/>
      </div>

      {/* Center: SLD */}
      <div style={{ flex:1, overflowY:'auto', padding:16, background: BRAND.bgPage }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: BRAND.textMut, marginBottom:12 }}>
          Single Line Diagram
        </div>
        <div className="card" style={{ padding:12 }}>
          <Sld detail={{...d, pss: unit}} selectedComp={selComp} onSelectComp={setSelComp}/>
        </div>
        {selComp && (
          <div style={{ marginTop:10, fontSize:11, color: BRAND.textSec, textAlign:'center' }}>
            Click component again or any empty area to deselect
          </div>
        )}
      </div>

      {/* Right: Faults + APFC + shutoff */}
      <div style={{
        width:300, flexShrink:0, borderLeft:`1px solid ${BRAND.border}`,
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        <ActiveFaults faults={d.faults}/>
        {apfc && <ApfcPanel apfc={apfc}/>}

        {/* Admin shutoff */}
        {userRole === 'admin' && (
          <div style={{ padding:'12px 14px', borderTop:`1px solid ${BRAND.border}`, flexShrink:0 }}>
            <button onClick={() => setShutoff(true)} style={{
              width:'100%', padding:'9px 14px', borderRadius:8,
              background:'transparent', border:`1.5px solid ${STATUS.critical.color}`,
              color: STATUS.critical.color, fontSize:13, fontWeight:600,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              transition:'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='#FEE2E2'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
            >
              <Ic name="zap" size={14} color={STATUS.critical.color}/>
              Request Shutoff
            </button>
          </div>
        )}
      </div>

      {showShutoff && <ShutoffModal pss={unit} onClose={() => setShutoff(false)}/>}
    </div>
  );
}

Object.assign(window, { ComponentList, ActiveFaults, ApfcPanel, ShutoffModal, PssDetail });
