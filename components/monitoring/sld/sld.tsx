'use client';
import { BRAND, STATUS } from '@/lib/brand';

export interface SldComponent {
  type: string; id: string; label: string; status: string;
  tripped?: boolean; spring?: boolean; relay?: boolean;
  v?: number; a?: number; hz?: number; pf?: number; kw?: number;
  kvar?: number; kwh?: number; oilT?: number; windT?: number;
  mog?: boolean; buch?: boolean; prv?: boolean; oltc?: number;
  reqKvar?: number; connKvar?: number; targetPf?: number; corrPf?: number;
  feeder_id?: string;
}

export interface SldConfig {
  has_acb2?:     boolean;   // alternate / DG source + ACB-2
  has_apfc?:     boolean;   // APFC panel
  has_oltc?:     boolean;   // OLTC on transformer
  has_buchholz?: boolean;   // Buchholz relay in transformer
  has_mfm2b?:    boolean;   // secondary bus metering (MFM-2B)
  feeder_count?: number;    // max feeders to show (null = all from DB)
}

export interface SldDetail {
  status: string; kva?: number; seen?: string | null;
  pss?: { kva?: number }; components: SldComponent[]; faults: unknown[];
  sld_config?: SldConfig;
}
interface SldProps {
  detail: SldDetail | null; selectedComp: string | null;
  onSelectComp: (id: string | null) => void;
}

const G  = '#10B981';
const GR = '#6B7280';
const OF = '#94A3B8';
const fmt = (v: number | undefined, d = 1, u = '') => v != null ? `${v.toFixed(d)}${u}` : '—';

function pillColor(c: SldComponent | undefined, offline: boolean, def = G) {
  if (offline) return OF;
  if (!c) return def;
  if (c.tripped || c.status === 'critical') return STATUS.critical.color;
  if (c.status === 'warning') return STATUS.warning.color;
  return def;
}

export function Sld({ detail, selectedComp, onSelectComp }: SldProps) {
  if (!detail) return null;
  const { status, components } = detail;
  const offline = status === 'offline';

  const get  = (t: string) => components.find(c => c.type === t);
  const gets = (t: string) => components.filter(c => c.type === t);
  const vcb  = get('HT_VCB');
  const htf  = get('HT_Feeder');
  const trf  = get('TRANSFORMER');
  const acb  = get('LT_ACB');
  const ltf  = get('LT_FEEDER');
  const apfc = get('APFC');

  // Merge sld_config with defaults; auto-enable has_apfc when telemetry data present
  const cfg: Required<SldConfig> = {
    has_acb2:     false,
    has_apfc:     !!apfc,
    has_oltc:     false,
    has_buchholz: false,
    has_mfm2b:    false,
    feeder_count: 4,
    ...(detail.sld_config ?? {}),
  };

  // Limit feeders to cfg.feeder_count (user access masking handled by backend)
  const outs = gets('LT_outgoing').slice(0, cfg.feeder_count);
  const nF   = cfg.feeder_count;      // show N columns regardless of data

  // ── Layout ───────────────────────────────────────────────────────────────
  const CX = 400, W = 760;
  const HP    = { x: 252, y: 18, w: 296, h: 188 };
  const VCB_Y = 66, RELAY_Y = 136;
  const MFM1_Y = 218;
  const TRF   = { x: 262, y: 236, w: 276, h: cfg.has_buchholz ? 176 : 164 };

  // LT Panel height adjusts: shrinks when no ACB2 / no MFM2B
  const LT_TOP = TRF.y + TRF.h + 12;
  const ACB_Y  = LT_TOP + 42;
  const ACB2X  = 222;
  const MFM2_Y = ACB_Y + 56;
  const CO_Y   = MFM2_Y + 64;
  const APFC_Y = CO_Y + 46;
  const BUS_Y  = cfg.has_apfc ? APFC_Y + 46 : CO_Y + 46;

  const FW = 108, FGAP = 14;
  const FX0    = CX - (nF * FW + (nF - 1) * FGAP) / 2;
  const fcx    = (i: number) => FX0 + i * (FW + FGAP) + FW / 2;
  const ffx    = (i: number) => FX0 + i * (FW + FGAP);
  const busX1  = FX0 - 18, busX2 = FX0 + nF * FW + (nF - 1) * FGAP + 18;

  const FMFM_Y  = BUS_Y + 30;
  const FMCCB_Y = FMFM_Y + 62;

  const LT = { x: 86, y: LT_TOP, w: Math.max(622, busX2 - 86 + 20), h: FMCCB_Y + 17 + 28 - LT_TOP };
  const H   = FMCCB_Y + 17 + 42;

  // ── Render helpers ────────────────────────────────────────────────────────
  function Line({ d, live = true }: { d: string; live?: boolean }) {
    return (
      <g>
        <path d={d} stroke="#CBD5E1" strokeWidth={2} fill="none" strokeLinejoin="round"/>
        {live && !offline && (
          <path d={d} stroke={G} strokeWidth={2} fill="none" strokeDasharray="6 5"
            strokeLinejoin="round" opacity={0.72}
            style={{ animation: 'sldFlow .85s linear infinite' }}/>
        )}
      </g>
    );
  }

  function Dot({ x, y, c = G }: { x: number; y: number; c?: string }) {
    return <circle cx={x} cy={y} r={4} fill={offline ? OF : c}/>;
  }

  function Pill({ cx, cy, w = 160, h = 34, lbl, clr, id }: {
    cx: number; cy: number; w?: number; h?: number;
    lbl: string; clr: string; id?: string;
  }) {
    const sel   = !!id && selectedComp === id;
    const comp  = id ? components.find(c => c.id === id) : undefined;
    const click = comp && !offline ? () => onSelectComp(sel ? null : id!) : undefined;
    return (
      <g onClick={click} style={{ cursor: click ? 'pointer' : 'default' }}>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={6}
          fill={clr} stroke={sel ? '#1D4ED8' : 'rgba(0,0,0,0.1)'} strokeWidth={sel ? 2.5 : 1}/>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 12, fontWeight: 700, fill: 'white', fontFamily: 'Inter,sans-serif', letterSpacing: .3 }}>
          {lbl}
        </text>
      </g>
    );
  }

  function Sub({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
    return (
      <text x={x} y={y} textAnchor="middle"
        style={{ fontSize: 8.5, fill: BRAND.textMut, fontFamily: 'Inter,sans-serif' }}>
        {children}
      </text>
    );
  }

  function PLabel({ x, y, a = 'middle' as const, children }: {
    x: number; y: number; a?: 'middle' | 'start'; children: React.ReactNode;
  }) {
    return (
      <text x={x} y={y} textAnchor={a}
        style={{ fontSize: 13, fontWeight: 800, fill: '#0F172A', fontFamily: 'Inter,sans-serif', letterSpacing: 1.5 }}>
        {children}
      </text>
    );
  }

  const vcbClr   = pillColor(vcb, offline);
  const relayClr = offline ? OF : (vcb?.relay === false ? STATUS.critical.color : G);
  const acbClr   = pillColor(acb, offline);
  const trfClr   = offline ? OF : ((trf?.oilT ?? 0) > 85 || trf?.prv ? STATUS.warning.color : G);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W + 30, display: 'block', margin: '0 auto' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>{`@keyframes sldFlow{from{stroke-dashoffset:22}to{stroke-dashoffset:0}}`}</style>
        </defs>

        {/* ══ HT PANEL ══ */}
        <PLabel x={CX} y={HP.y - 7}>HT PANEL</PLabel>
        <rect x={HP.x} y={HP.y} width={HP.w} height={HP.h} rx={6}
          fill="none" stroke="#0F172A" strokeWidth={2.5}/>

        <Pill cx={CX} cy={VCB_Y} lbl="VCB + RMU" clr={vcbClr} id={vcb?.id}/>
        <Sub x={CX} y={VCB_Y + 24}>
          {vcb ? (vcb.tripped ? '⚡ TRIPPED' : `CLOSED${vcb.spring ? ' · Spring: Ready' : ''}`) : '—'}
        </Sub>

        <line x1={CX} y1={VCB_Y + 17} x2={CX} y2={RELAY_Y - 17} stroke="#CBD5E1" strokeWidth={2}/>

        <Pill cx={CX} cy={RELAY_Y} lbl="PROTECTION RELAY" clr={relayClr}/>
        <Sub x={CX} y={RELAY_Y + 24}>
          {vcb?.relay === false ? '⚠ FAULT DETECTED' : 'OK — No fault'}
        </Sub>

        {/* HP bottom → MFM-1 junction → TRF */}
        <Line d={`M${CX} ${HP.y + HP.h} L${CX} ${TRF.y}`} live={!vcb?.tripped}/>
        <Dot x={CX} y={MFM1_Y}/>

        {/* MFM-1 branch RIGHT */}
        <Line d={`M${CX} ${MFM1_Y} L${540} ${MFM1_Y}`} live={!vcb?.tripped}/>
        <Pill cx={592} cy={MFM1_Y} w={112} h={30} lbl="MFM - 1" clr={offline ? OF : G} id={htf?.id}/>
        {htf && <>
          <Sub x={592} y={MFM1_Y + 22}>
            {htf.v != null ? `${(htf.v / 1000).toFixed(1)} kV` : '—'} · {fmt(htf.a, 1, ' A')}
          </Sub>
          <text x={592} y={MFM1_Y + 33} textAnchor="middle"
            style={{ fontSize: 8, fontWeight: 600, fill: offline ? OF : BRAND.blue, fontFamily: 'Inter,sans-serif' }}>
            {fmt(htf.kw, 0, ' kW')} · PF {fmt(htf.pf, 2)}
          </text>
        </>}

        {/* ══ TRANSFORMER ══ */}
        <rect x={TRF.x} y={TRF.y} width={TRF.w} height={TRF.h} rx={8} fill={trfClr}
          onClick={trf && !offline ? () => onSelectComp(selectedComp === trf.id ? null : trf.id) : undefined}
          style={{ cursor: trf && !offline ? 'pointer' : 'default' }}/>
        <text x={CX} y={TRF.y + 28} textAnchor="middle"
          style={{ fontSize: 28, fontWeight: 900, fill: 'white', fontFamily: 'Inter,sans-serif', letterSpacing: 3 }}>TRF</text>
        <line x1={TRF.x + 14} y1={TRF.y + 38} x2={TRF.x + TRF.w - 14} y2={TRF.y + 38}
          stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
        <text x={TRF.x + 14} y={TRF.y + 54}
          style={{ fontSize: 8, fill: 'rgba(255,255,255,.65)', fontFamily: 'Inter', fontWeight: 600 }}>OIL TEMP</text>
        <text x={TRF.x + TRF.w - 14} y={TRF.y + 54} textAnchor="end"
          style={{ fontSize: 8, fill: 'rgba(255,255,255,.65)', fontFamily: 'Inter', fontWeight: 600 }}>WINDING TEMP</text>
        <text x={TRF.x + 14} y={TRF.y + 74}
          style={{ fontSize: 17, fill: 'white', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
          {fmt(trf?.oilT, 1, '°C')}
        </text>
        <text x={TRF.x + TRF.w - 14} y={TRF.y + 74} textAnchor="end"
          style={{ fontSize: 17, fill: 'white', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
          {fmt(trf?.windT, 1, '°C')}
        </text>
        <line x1={TRF.x + 14} y1={TRF.y + 82} x2={TRF.x + TRF.w - 14} y2={TRF.y + 82}
          stroke="rgba(255,255,255,0.2)" strokeWidth={1}/>
        {cfg.has_oltc ? <>
          <text x={TRF.x + 14} y={TRF.y + 98}
            style={{ fontSize: 8, fill: 'rgba(255,255,255,.65)', fontFamily: 'Inter', fontWeight: 600 }}>OLTC TAP</text>
          <text x={TRF.x + 14} y={TRF.y + 116}
            style={{ fontSize: 16, fill: 'white', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
            {trf?.oltc != null ? (trf.oltc >= 0 ? `+${trf.oltc}` : String(trf.oltc)) : '—'}
          </text>
        </> : null}
        <text x={CX} y={TRF.y + 98} textAnchor="middle"
          style={{ fontSize: 8, fill: 'rgba(255,255,255,.65)', fontFamily: 'Inter', fontWeight: 600 }}>
          {(detail.pss?.kva ?? detail.kva ?? 2500).toLocaleString()} kVA
        </text>
        <text x={TRF.x + TRF.w - 14} y={TRF.y + 98} textAnchor="end"
          style={{ fontSize: 8, fill: 'rgba(255,255,255,.65)', fontFamily: 'Inter', fontWeight: 600 }}>MOG , PRV</text>
        <text x={TRF.x + TRF.w - 14} y={TRF.y + 116} textAnchor="end"
          style={{ fontSize: 9, fill: trf?.prv ? '#FCD34D' : 'rgba(255,255,255,.88)', fontFamily: 'Inter', fontWeight: 600 }}>
          {trf?.mog === false ? '⚠ MOG FAULT' : 'MOG OK'} · {trf?.prv ? '⚡ PRV' : 'PRV OK'}
        </text>
        {cfg.has_buchholz && (
          <text x={CX} y={TRF.y + TRF.h - 18} textAnchor="middle"
            style={{ fontSize: 8, fill: 'rgba(255,255,255,.65)', fontFamily: 'Inter', fontWeight: 600 }}>Buchholz</text>
        )}
        {cfg.has_buchholz && (
          <text x={CX} y={TRF.y + TRF.h - 6} textAnchor="middle"
            style={{ fontSize: 9, fill: trf?.buch ? '#FCD34D' : 'rgba(255,255,255,.88)', fontFamily: 'Inter', fontWeight: 600 }}>
            {trf?.buch ? '⚠ ALARM' : 'OK'}
          </text>
        )}

        {/* TRF bottom → ACB-1 */}
        <Line d={`M${CX} ${TRF.y + TRF.h} L${CX} ${ACB_Y - 17}`} live={!acb?.tripped}/>

        {/* ══ LT PANEL ══ */}
        <rect x={LT.x} y={LT.y} width={LT.w} height={LT.h} rx={6}
          fill="none" stroke="#0F172A" strokeWidth={2.5}/>
        <PLabel x={LT.x + LT.w + 12} y={LT.y + LT.h / 2 + 5} a="start">LT PANEL</PLabel>

        {/* ACB-2 — only if has_acb2; has its OWN power source arrow above, independent of ACB-1 */}
        {cfg.has_acb2 && <>
          {/* Alternate source indicator (arrow from above into ACB-2) */}
          <text x={ACB2X} y={LT.y + 14} textAnchor="middle"
            style={{ fontSize: 7.5, fontWeight: 700, fill: GR, fontFamily: 'Inter,sans-serif', letterSpacing: .5 }}>
            DG / ALT SOURCE
          </text>
          {/* dashed line from label down to ACB-2 top */}
          <line x1={ACB2X} y1={LT.y + 18} x2={ACB2X} y2={ACB_Y - 17}
            stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 3"/>
          {/* arrowhead pointing down into ACB-2 */}
          <path d={`M${ACB2X - 5} ${ACB_Y - 24} L${ACB2X} ${ACB_Y - 17} L${ACB2X + 5} ${ACB_Y - 24}`}
            stroke="#CBD5E1" strokeWidth={2} fill="none"/>

          <Pill cx={ACB2X} cy={ACB_Y} w={120} h={34} lbl="ACB - 2" clr={offline ? OF : GR}/>
          <Sub x={ACB2X} y={ACB_Y + 24}>OPEN · Alternate</Sub>

          {/* MFM-2B branch LEFT (if enabled) */}
          {cfg.has_mfm2b && <>
            <Dot x={ACB2X} y={MFM2_Y} c={GR}/>
            <Line d={`M${ACB2X} ${MFM2_Y} L${172} ${MFM2_Y}`} live={false}/>
            <Pill cx={138} cy={MFM2_Y} w={112} h={30} lbl="MFM - 2B" clr={offline ? OF : GR}/>
            <Sub x={138} y={MFM2_Y + 22}>— Secondary bus</Sub>
          </>}

          {/* ACB-2 path: down → across into CHARGE OVER left */}
          <Line d={`M${ACB2X} ${ACB_Y + 17} L${ACB2X} ${CO_Y} L${CX - 80} ${CO_Y}`} live={false}/>
        </>}

        {/* ACB-1 (main, always present) */}
        <Pill cx={CX} cy={ACB_Y} lbl="ACB - 1" clr={acbClr} id={acb?.id}/>
        <Sub x={CX} y={ACB_Y + 24}>
          {acb ? (acb.tripped ? '⚡ TRIPPED' : `CLOSED · ${fmt(ltf?.v, 0, ' V')}`) : '—'}
        </Sub>

        {/* ACB-1 → CO vertical spine */}
        <Line d={`M${CX} ${ACB_Y + 17} L${CX} ${CO_Y - 17}`} live={!acb?.tripped}/>

        {/* MFM-2A junction + branch RIGHT (always present with ACB-1) */}
        <Dot x={CX} y={MFM2_Y}/>
        <Line d={`M${CX} ${MFM2_Y} L${540} ${MFM2_Y}`} live={!acb?.tripped}/>
        <Pill cx={592} cy={MFM2_Y} w={112} h={30} lbl="MFM - 2A" clr={offline ? OF : G} id={ltf?.id}/>
        {ltf && (
          <Sub x={592} y={MFM2_Y + 22}>
            {fmt(ltf.kw, 0, ' kW')} · PF {fmt(ltf.pf, 2)} · {fmt(ltf.a, 1, ' A')}
          </Sub>
        )}

        {/* CHARGE OVER */}
        <Pill cx={CX} cy={CO_Y} lbl="CHARGE OVER" clr={offline ? OF : G}/>
        <Sub x={CX} y={CO_Y + 24}>
          {cfg.has_acb2 ? 'AUTO — MAINS / DG' : 'MAINS'}
        </Sub>

        {/* CO → APFC junction → BUS */}
        <Line d={`M${CX} ${CO_Y + 17} L${CX} ${BUS_Y}`} live={true}/>

        {/* APFC branch RIGHT (only if has_apfc) */}
        {cfg.has_apfc && apfc && <>
          <Dot x={CX} y={APFC_Y}/>
          <Line d={`M${CX} ${APFC_Y} L${540} ${APFC_Y}`} live={true}/>
          <Pill cx={592} cy={APFC_Y} w={112} h={30} lbl="APFC"
            clr={pillColor(apfc, offline)} id={apfc.id}/>
          <Sub x={592} y={APFC_Y + 22}>
            PF {fmt(apfc.corrPf, 2)} · {apfc.connKvar ?? '—'} kVAR
          </Sub>
        </>}

        {/* 415V LT BUS */}
        <line x1={busX1} y1={BUS_Y} x2={busX2} y2={BUS_Y}
          stroke="#E2E8F0" strokeWidth={14} strokeLinecap="round"/>
        <line x1={busX1} y1={BUS_Y} x2={busX2} y2={BUS_Y}
          stroke={offline ? OF : G} strokeWidth={8} strokeLinecap="round" opacity={0.88}/>
        <text x={busX1 + 4} y={BUS_Y - 10}
          style={{ fontSize: 8, fontWeight: 700, fill: BRAND.textMut, fontFamily: 'Inter,sans-serif' }}>415V LT BUS</text>
        {ltf && (
          <text x={busX2 - 4} y={BUS_Y - 10} textAnchor="end"
            style={{ fontSize: 8, fontWeight: 600, fill: offline ? OF : BRAND.blue, fontFamily: 'Inter,sans-serif' }}>
            {fmt(ltf.kw, 0, ' kW')} · PF {fmt(ltf.pf, 2)}
          </text>
        )}

        {/* ══ N Feeder columns ══ */}
        {Array.from({ length: nF }, (_, i) => {
          const f   = outs[i];
          const cx  = fcx(i), fx = ffx(i);
          const fC  = f ? pillColor(f, offline) : (offline ? OF : GR);
          const mC  = f && !offline ? G : (offline ? OF : GR);
          const sel = !!f && selectedComp === f.id;
          return (
            <g key={i}>
              <Line d={`M${cx} ${BUS_Y + 7} L${cx} ${FMFM_Y - 16}`} live={!!f && !f.tripped}/>
              <rect x={fx} y={FMFM_Y - 16} width={FW} height={32} rx={6} fill={mC}
                stroke="rgba(0,0,0,0.1)" strokeWidth={1}/>
              <text x={cx} y={FMFM_Y} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 11, fontWeight: 700, fill: 'white', fontFamily: 'Inter,sans-serif' }}>
                {`MFM - ${i + 3}`}
              </text>
              <Sub x={cx} y={FMFM_Y + 22}>
                {f && !offline ? `${f.kw ?? '—'} kW` : '—'}
              </Sub>
              <Line d={`M${cx} ${FMFM_Y + 16} L${cx} ${FMCCB_Y - 17}`} live={!!f && !f.tripped}/>
              <g onClick={f && !offline ? () => onSelectComp(sel ? null : f.id) : undefined}
                style={{ cursor: f && !offline ? 'pointer' : 'default' }}>
                <rect x={fx} y={FMCCB_Y - 17} width={FW} height={34} rx={6} fill={fC}
                  stroke={sel ? '#1D4ED8' : 'rgba(0,0,0,0.1)'} strokeWidth={sel ? 2.5 : 1}/>
                <text x={cx} y={FMCCB_Y} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: 12, fontWeight: 700, fill: 'white', fontFamily: 'Inter,sans-serif' }}>
                  {`MCCB - ${i + 1}`}
                </text>
                <text x={cx} y={FMCCB_Y + 13} textAnchor="middle"
                  style={{ fontSize: 8.5, fill: 'rgba(255,255,255,0.85)', fontFamily: 'Inter,sans-serif' }}>
                  {f ? (f.tripped ? '⚡ TRIPPED' : 'CLOSED') : 'N/A'}
                </text>
              </g>
            </g>
          );
        })}

        {/* Offline overlay */}
        {offline && (
          <g>
            <rect x={0} y={0} width={W} height={H} fill="rgba(248,250,252,0.86)"/>
            <rect x={CX - 115} y={H / 2 - 48} width={230} height={96} rx={12}
              fill="white" stroke="#E2E8F0" strokeWidth={1.5}/>
            <text x={CX} y={H / 2 - 16} textAnchor="middle"
              style={{ fontSize: 15, fontWeight: 700, fill: '#475569', fontFamily: 'Inter,sans-serif' }}>
              PSS Offline
            </text>
            <text x={CX} y={H / 2 + 8} textAnchor="middle"
              style={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter,sans-serif' }}>
              {`Last seen ${detail.seen ? new Date(detail.seen).toLocaleTimeString() : '—'}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
