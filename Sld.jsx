// Sld.jsx — SVG Single Line Diagram (clean modern style)

function Sld({ detail, selectedComp, onSelectComp }) {
  if (!detail) return null;

  const { status, components } = detail;
  const isOffline = status === 'offline';

  const getComp  = type => components.find(c => c.type === type);
  const getComps = type => components.filter(c => c.type === type);

  const vcb  = getComp('HT_VCB');
  const htf  = getComp('HT_Feeder');
  const trf  = getComp('TRANSFORMER');
  const acb  = getComp('LT_ACB');
  const ltf  = getComp('LT_FEEDER');
  const outs = getComps('LT_outgoing');
  const apfc = getComp('APFC');

  const sColor = s => (STATUS[s] || STATUS.offline).color;
  const sBg    = s => (STATUS[s] || STATUS.offline).bg;

  // ── Box component ──────────────────────────────────────────────────────────
  function Box({ id, x, y, w, h, status = 'normal', children }) {
    const sel   = selectedComp === id;
    const sc    = isOffline ? STATUS.offline.color : sColor(status);
    const sw    = status === 'critical' ? 2.5 : status === 'warning' ? 2 : 1.5;
    return (
      <g onClick={() => !isOffline && onSelectComp(sel ? null : id)} style={{ cursor: isOffline?'default':'pointer' }}>
        <rect
          x={x} y={y} width={w} height={h} rx={8} ry={8}
          fill={sel ? '#EFF6FF' : '#FFFFFF'}
          stroke={sel ? BRAND.blue : sc}
          strokeWidth={sel ? 2.5 : sw}
          filter="url(#cardShadow)"
        />
        {status === 'critical' && !isOffline && (
          <rect x={x} y={y} width={w} height={h} rx={8} ry={8}
            fill="none" stroke={sc} strokeWidth={1} opacity={0.3}
            style={{ animation:'pulseDot 1.2s ease-in-out infinite' }}
          />
        )}
        {children}
      </g>
    );
  }

  // ── FlowLine ───────────────────────────────────────────────────────────────
  function FlowLine({ x1, y1, x2, y2, status = 'normal' }) {
    const alive = !isOffline && status !== 'offline';
    const clr   = isOffline ? STATUS.offline.color : sColor(status);
    const d     = `M${x1} ${y1} L${x2} ${y2}`;
    return (
      <g>
        <path d={d} stroke="#E2E8F0" strokeWidth={2} fill="none"/>
        {alive && (
          <path d={d} stroke={clr} strokeWidth={2} fill="none"
            strokeDasharray="6 4"
            style={{ animation:'flowDown 0.7s linear infinite' }}
            opacity={0.8}
          />
        )}
      </g>
    );
  }

  // ── HBusLine ──────────────────────────────────────────────────────────────
  function HBusLine({ x1, x2, y, status = 'normal' }) {
    const clr = isOffline ? STATUS.offline.color : sColor(status);
    return (
      <g>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke="#E2E8F0" strokeWidth={10} strokeLinecap="round"/>
        <line x1={x1} y1={y} x2={x2} y2={y} stroke={clr}    strokeWidth={6}  strokeLinecap="round" opacity={isOffline?0.5:0.85}/>
      </g>
    );
  }

  // ── Text helpers ───────────────────────────────────────────────────────────
  const TX = ({ x, y, children, size=10, weight=400, color='#64748B', anchor='middle', mono=false }) => (
    <text x={x} y={y} textAnchor={anchor}
      style={{ fontSize:size, fontWeight:weight, fill:color, fontFamily: mono?'JetBrains Mono,monospace':'Inter,sans-serif' }}>
      {children}
    </text>
  );

  // Layout constants
  const CX = 230;   // center X

  // Grid header
  const GY = 30;
  // VCB:  y=68, h=50
  const VY=68, VH=50, VW=120;
  // HT Feeder: y=148, h=88
  const HY=148, HH=88, HW=160;
  // TRF: y=268, h=110
  const TY=268, TH=110, TW=210;
  // ACB: y=410, h=50
  const AY=410, AH=50, AW=120;
  // LT Bus: y=495
  const BY=495;
  // Feeders: y=535, h=74
  const FY=535, FH=74;

  // Feeder spacing
  const nFeeders = outs.length;
  const FW = 72;
  const GAP = nFeeders >= 4 ? 10 : 16;
  const totalW = nFeeders * FW + (nFeeders-1) * GAP;
  const FX0 = CX - totalW/2;
  const feederX = i => FX0 + i*(FW+GAP);
  const feederCX = i => feederX(i) + FW/2;

  // Bus bar extents
  const busX1 = Math.min(feederCX(0), CX) - 30;
  const busX2 = Math.max(feederCX(nFeeders-1), CX) + 30;

  return (
    <div style={{ width:'100%', overflowX:'auto' }}>
      <svg viewBox="0 0 460 640" style={{ width:'100%', maxWidth:480, display:'block', margin:'0 auto' }}
        xmlns="http://www.w3.org/2000/svg">

        <defs>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx={0} dy={1} stdDeviation={3} floodColor="#0F172A" floodOpacity={0.07}/>
          </filter>
          <style>{`
            @keyframes flowDown { from { stroke-dashoffset:20; } to { stroke-dashoffset:0; } }
            @keyframes pulseDot { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
          `}</style>
        </defs>

        {/* ── Grid Input ────────────────────────────────────────────────── */}
        <rect x={CX-60} y={GY-14} width={120} height={26} rx={6} fill="#F8FAFC" stroke={BRAND.border} strokeWidth={1}/>
        <TX x={CX} y={GY+4} size={10} weight={600} color={BRAND.textSec}>11kV GRID INPUT</TX>

        <FlowLine x1={CX} y1={GY+12} x2={CX} y2={VY} status={vcb?.status || 'normal'}/>

        {/* ── HT VCB ────────────────────────────────────────────────────── */}
        <Box id={vcb?.id} x={CX-VW/2} y={VY} w={VW} h={VH} status={vcb?.status}>
          <TX x={CX} y={VY+14} size={9} weight={600} color={BRAND.textMut}>HT BREAKER (VCB)</TX>
          <TX x={CX} y={VY+29} size={11} weight={700} mono color={
            vcb?.tripped ? STATUS.critical.color : sColor(vcb?.status || 'normal')
          }>
            {vcb?.tripped ? '⚡ TRIPPED' : 'CLOSED'}
          </TX>
          <TX x={CX} y={VY+43} size={9} color={BRAND.textMut}>
            Spring: {vcb?.spring ? 'Ready' : 'Not Ready'} · Relay: {vcb?.relay ? 'OK' : 'Fault'}
          </TX>
        </Box>

        <FlowLine x1={CX} y1={VY+VH} x2={CX} y2={HY} status={htf?.status || 'normal'}/>

        {/* ── HT Feeder ─────────────────────────────────────────────────── */}
        <Box id={htf?.id} x={CX-HW/2} y={HY} w={HW} h={HH} status={htf?.status}>
          <TX x={CX} y={HY+13} size={9} weight={600} color={BRAND.textMut}>HT METERING (EN6400)</TX>

          <TX x={CX-HW/2+14} y={HY+30} size={9} weight={600} color={BRAND.textMut} anchor="start">Voltage</TX>
          <TX x={CX+HW/2-14} y={HY+30} size={9} weight={600} color={BRAND.textMut} anchor="end">Current</TX>
          <TX x={CX-HW/2+14} y={HY+43} size={12} weight={700} mono color={BRAND.text} anchor="start">
            {htf ? `${htf.v != null ? (htf.v/1000).toFixed(1) : '—'} kV` : '—'}
          </TX>
          <TX x={CX+HW/2-14} y={HY+43} size={12} weight={700} mono color={BRAND.text} anchor="end">
            {htf ? `${htf.a != null ? htf.a.toFixed(1) : '—'} A` : '—'}
          </TX>

          <line x1={CX-HW/2+10} y1={HY+51} x2={CX+HW/2-10} y2={HY+51} stroke={BRAND.border} strokeWidth={1}/>

          <TX x={CX} y={HY+64} size={13} weight={700} mono color={BRAND.blue}>
            {htf ? `${(htf.kw ?? 0).toLocaleString('en-IN')} kW` : '—'}
          </TX>
          <TX x={CX} y={HY+79} size={9} mono color={BRAND.textSec}>
            {htf ? `PF ${htf.pf != null ? htf.pf.toFixed(2) : '—'}  ·  ${htf.hz ?? '—'} Hz` : ''}
          </TX>
        </Box>

        <FlowLine x1={CX} y1={HY+HH} x2={CX} y2={TY} status={trf?.status || 'normal'}/>

        {/* ── Transformer ───────────────────────────────────────────────── */}
        <Box id={trf?.id} x={CX-TW/2} y={TY} w={TW} h={TH} status={trf?.status}>
          <TX x={CX} y={TY+15} size={9} weight={600} color={BRAND.textMut}>MAIN TRANSFORMER</TX>
          <TX x={CX} y={TY+28} size={10} weight={500} color={BRAND.textSec}>
            {trf ? `${(detail.pss?.kva ?? detail.kva ?? 2500).toLocaleString()} kVA  ·  11 / 0.415 kV` : ''}
          </TX>

          <line x1={CX-TW/2+12} y1={TY+36} x2={CX+TW/2-12} y2={TY+36} stroke={BRAND.border} strokeWidth={1}/>

          {/* Temps */}
          <TX x={CX-TW/2+16} y={TY+52} size={9} weight={600} color={BRAND.textMut} anchor="start">Oil Temp</TX>
          <TX x={CX+TW/2-16} y={TY+52} size={9} weight={600} color={BRAND.textMut} anchor="end">Winding</TX>
          <TX x={CX-TW/2+16} y={TY+65} size={13} weight={700} mono anchor="start"
            color={trf?.oilT != null ? (trf.oilT>=85?STATUS.critical.color:trf.oilT>=70?STATUS.warning.color:BRAND.text) : BRAND.text}>
            {trf?.oilT != null ? `${trf.oilT.toFixed(1)}°C` : '—'}
          </TX>
          <TX x={CX+TW/2-16} y={TY+65} size={13} weight={700} mono anchor="end"
            color={trf?.windT != null ? (trf.windT>=120?STATUS.critical.color:trf.windT>=100?STATUS.warning.color:BRAND.text) : BRAND.text}>
            {trf?.windT != null ? `${trf.windT.toFixed(1)}°C` : '—'}
          </TX>

          <line x1={CX-TW/2+12} y1={TY+73} x2={CX+TW/2-12} y2={TY+73} stroke={BRAND.border} strokeWidth={1}/>

          <TX x={CX-TW/2+16} y={TY+88} size={9} weight={600} color={BRAND.textMut} anchor="start">
            {trf?.buch ? '⚠ Buchholz ALARM' : 'Buchholz: OK'}
          </TX>
          <TX x={CX+TW/2-16} y={TY+88} size={9} weight={600} color={trf?.buch?STATUS.warning.color:BRAND.textMut} anchor="end">
            OLTC Tap: {trf ? (trf.oltc >= 0 ? `+${trf.oltc}` : `${trf.oltc}`) : '—'}
          </TX>

          <TX x={CX} y={TY+104} size={8} color={BRAND.textMut}>
            {trf ? `MOG: ${trf.mog?'OK':'Fault'}  ·  PRV: ${trf.prv?'TRIPPED':'OK'}` : ''}
          </TX>
        </Box>

        <FlowLine x1={CX} y1={TY+TH} x2={CX} y2={AY} status={acb?.status || 'normal'}/>

        {/* ── LT ACB ────────────────────────────────────────────────────── */}
        <Box id={acb?.id} x={CX-AW/2} y={AY} w={AW} h={AH} status={acb?.status}>
          <TX x={CX} y={AY+14} size={9} weight={600} color={BRAND.textMut}>LT MAIN BREAKER (ACB)</TX>
          <TX x={CX} y={AY+29} size={11} weight={700} mono color={
            acb?.tripped ? STATUS.critical.color : sColor(acb?.status || 'normal')
          }>
            {acb?.tripped ? '⚡ TRIPPED' : 'CLOSED'}
          </TX>
          <TX x={CX} y={AY+43} size={9} color={BRAND.textMut}>
            {ltf ? `${ltf.v ?? 415} V  ·  ${(ltf.a ?? 0).toLocaleString('en-IN')} A` : '415 V  ·  —'}
          </TX>
        </Box>

        <FlowLine x1={CX} y1={AY+AH} x2={CX} y2={BY} status={ltf?.status || 'normal'}/>

        {/* ── LT Bus label ─────────────────────────────────────────────── */}
        <TX x={busX1} y={BY-6} size={8} weight={600} color={BRAND.textMut} anchor="start">415V LT BUS</TX>
        <TX x={busX2} y={BY-6} size={8} weight={500} mono color={
          ltf ? (ltf.pf>=0.95?'#16A34A':ltf.pf>=0.9?'#D97706':'#DC2626') : BRAND.textMut
        } anchor="end">
          {ltf ? `PF ${(ltf.pf ?? 0).toFixed(2)}  ·  ${(ltf.kw ?? 0).toLocaleString('en-IN')} kW` : ''}
        </TX>
        <HBusLine x1={busX1} x2={busX2} y={BY} status={ltf?.status || 'normal'}/>

        {/* ── LT Outgoing Feeders ───────────────────────────────────────── */}
        {outs.map((f, i) => {
          const cx = feederCX(i);
          const fx = feederX(i);
          const fSel = selectedComp === f.id;
          return (
            <g key={f.id}>
              <FlowLine x1={cx} y1={BY+5} x2={cx} y2={FY} status={f.status}/>
              <g onClick={() => !isOffline && onSelectComp(fSel ? null : f.id)} style={{ cursor: isOffline?'default':'pointer' }}>
                <rect x={fx} y={FY} width={FW} height={FH} rx={8}
                  fill={fSel ? '#EFF6FF' : '#FFFFFF'}
                  stroke={fSel ? BRAND.blue : (isOffline ? STATUS.offline.color : sColor(f.status))}
                  strokeWidth={fSel ? 2.5 : 1.5}
                  filter="url(#cardShadow)"
                />
                <TX x={cx} y={FY+14} size={10} weight={700} color={fSel?BRAND.blue:BRAND.text}>F{i+1}</TX>
                <TX x={cx} y={FY+28} size={9} weight={500} color={BRAND.textMut}>
                  {f.label.split('—')[1]?.trim().substring(0,10) || f.id}
                </TX>
                <line x1={fx+8} y1={FY+35} x2={fx+FW-8} y2={FY+35} stroke={BRAND.border} strokeWidth={1}/>
                <TX x={cx} y={FY+49} size={12} weight={700} mono color={isOffline?BRAND.textMut:BRAND.text}>
                  {isOffline ? '—' : `${f.kw} kW`}
                </TX>
                <TX x={cx} y={FY+63} size={9} mono color={BRAND.textMut}>
                  {isOffline ? '' : `${f.a} A`}
                </TX>
              </g>
            </g>
          );
        })}

        {/* ── APFC indicator (if present) ───────────────────────────────── */}
        {apfc && (
          <g>
            <line x1={busX2} y1={BY} x2={busX2+16} y2={BY} stroke={isOffline?STATUS.offline.color:sColor(apfc.status)} strokeWidth={2}/>
            <g onClick={() => !isOffline && onSelectComp(selectedComp===apfc.id?null:apfc.id)} style={{ cursor:isOffline?'default':'pointer' }}>
              <rect x={busX2+16} y={BY-30} width={72} height={60} rx={8}
                fill={selectedComp===apfc.id?'#EFF6FF':'#FFFFFF'}
                stroke={selectedComp===apfc.id?BRAND.blue:(isOffline?STATUS.offline.color:sColor(apfc.status))}
                strokeWidth={selectedComp===apfc.id?2.5:1.5}
                filter="url(#cardShadow)"
              />
              <TX x={busX2+52} y={BY-16} size={8} weight={600} color={BRAND.textMut}>APFC</TX>
              <TX x={busX2+52} y={BY} size={10} weight={700} mono
                color={isOffline?BRAND.textMut:(apfc.corrPf>=0.95?'#16A34A':apfc.corrPf>=0.9?'#D97706':'#DC2626')}>
                {isOffline ? '—' : `PF ${apfc.corrPf?.toFixed(2)}`}
              </TX>
              <TX x={busX2+52} y={BY+16} size={8} mono color={BRAND.textMut}>
                {isOffline ? '' : `${apfc.connKvar} kVAR`}
              </TX>
            </g>
          </g>
        )}

        {/* ── Offline overlay ────────────────────────────────────────────── */}
        {isOffline && (
          <g>
            <rect x={0} y={0} width={460} height={640} fill="rgba(241,245,249,0.82)" rx={0}/>
            <rect x={130} y={280} width={200} height={80} rx={12}
              fill="#FFFFFF" stroke={BRAND.border} strokeWidth={1}
              filter="url(#cardShadow)"
            />
            <TX x={230} y={311} size={13} weight={700} color={BRAND.textSec}>PSS Offline</TX>
            <TX x={230} y={332} size={11} color={BRAND.textMut}>
              {`Last seen ${fmt.timeAgo(detail.seen)}`}
            </TX>
            <TX x={230} y={350} size={10} color={STATUS.offline.color}>No live data available</TX>
          </g>
        )}
      </svg>
    </div>
  );
}

window.Sld = Sld;
