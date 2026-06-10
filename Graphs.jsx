// Graphs.jsx — Historical telemetry charts with ECharts
const { useState, useMemo } = React;

const TIME_RANGES = [
  { label:'1H',  hours:1    },
  { label:'6H',  hours:6    },
  { label:'24H', hours:24   },
  { label:'7D',  hours:168  },
  { label:'30D', hours:720  },
];

function Graphs({ pssId, pss, telemetry }) {
  const [tab, setTab]     = useState('ht');
  const [range, setRange] = useState('24H');

  const unit = pss.find(p => p.id === pssId);
  const tel  = telemetry?.[pssId];

  // Filter series by time range
  const hrs = TIME_RANGES.find(r => r.label === range)?.hours || 24;
  function sliceSeries(series) {
    if (!series) return [];
    const cutoff = Date.now() - hrs * 3600000;
    return series.filter(([t]) => new Date(t).getTime() >= cutoff);
  }

  // ── Shared ECharts base config ─────────────────────────────────────────────
  function mkChart(overrides) {
    return {
      ...chartBase,
      ...overrides,
      grid: { ...chartBase.grid, ...overrides.grid },
      xAxis: { ...chartBase.xAxis, ...overrides.xAxis },
      tooltip: { ...chartBase.tooltip, ...overrides.tooltip },
    };
  }

  function areaOpts(data, name, color, yName, yMin, yMax, threshold) {
    const s = sliceSeries(data);
    const series = [{
      name, type:'line', data: s,
      smooth: true, symbol:'none',
      lineStyle: { color, width:2 },
      areaStyle: { color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:color+'40'},{offset:1,color:color+'05'}]}},
    }];
    if (threshold) {
      series.push({
        type:'line', data: s.map(([t]) => [t, threshold]),
        lineStyle:{ color:'#DC2626', type:'dashed', width:1 },
        symbol:'none', name:'Threshold',
      });
    }
    return mkChart({
      legend: threshold ? { data:[name,'Threshold'], right:12, top:2, textStyle:{fontSize:11,color:'#64748B'} } : undefined,
      yAxis: { ...chartBase.yAxis, name:yName, nameTextStyle:{color:'#94A3B8',fontSize:10}, min:yMin, max:yMax },
      series,
    });
  }

  function lineOpts(seriesDefs, yName, yMin, yMax) {
    const palette = [BRAND.blue, '#D97706', '#16A34A', '#7C3AED', '#0891B2'];
    return mkChart({
      legend: seriesDefs.length > 1 ? {
        data: seriesDefs.map(s=>s.name), right:12, top:2,
        textStyle:{ fontSize:11, color:'#64748B' },
      } : undefined,
      yAxis: { ...chartBase.yAxis, name:yName, nameTextStyle:{color:'#94A3B8',fontSize:10},
        min:yMin, max:yMax, splitNumber:5 },
      series: seriesDefs.map((s,i) => ({
        name: s.name, type:'line', data: sliceSeries(s.data),
        smooth:true, symbol:'none',
        lineStyle:{ color: s.color||palette[i%palette.length], width: s.bold?2.5:2 },
        ...(s.area ? {
          areaStyle:{ color:{ type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:(s.color||palette[0])+'35'},{offset:1,color:(s.color||palette[0])+'05'}]}},
        } : {}),
      })),
    });
  }

  function stepOpts(data, name, color) {
    return mkChart({
      yAxis: { ...chartBase.yAxis, name:'OLTC Tap', nameTextStyle:{color:'#94A3B8',fontSize:10},
        min:-8, max:8, interval:2, splitNumber:8 },
      series:[{
        name, type:'line', data: sliceSeries(data),
        step:'end', symbol:'none',
        lineStyle:{ color, width:2 },
        areaStyle:{ color:color+'25' },
      }],
    });
  }

  const pfZoneOpts = (data, name) => {
    const s = sliceSeries(data);
    return mkChart({
      yAxis: {
        ...chartBase.yAxis, name:'Power Factor',
        nameTextStyle:{color:'#94A3B8',fontSize:10},
        min:0.75, max:1.0, splitNumber:5,
      },
      visualMap: {
        show:false, type:'piecewise',
        dimension:1,
        pieces:[
          { min:0.95, max:1.01, color:'#16A34A' },
          { min:0.90, max:0.95, color:'#D97706' },
          { min:0,    max:0.90, color:'#DC2626' },
        ],
      },
      series:[{
        name, type:'line', data:s, smooth:true, symbol:'none',
        lineStyle:{ width:2 },
        areaStyle:{ opacity:0.15 },
      }],
    });
  };

  const tabs = [
    { id:'ht',  label:'HT Feeder'    },
    { id:'trf', label:'Transformer'  },
    { id:'lt',  label:'LT Feeders'   },
    { id:'apfc',label:'APFC'         },
  ];

  // Chart section helper
  function ChartSection({ title, subtitle, chart, height=220 }) {
    return (
      <div className="card" style={{ padding:'14px 16px 12px' }}>
        {(title||subtitle) && (
          <div style={{ marginBottom:10 }}>
            {title && <div style={{ fontSize:12, fontWeight:600, color: BRAND.text }}>{title}</div>}
            {subtitle && <div style={{ fontSize:11, color: BRAND.textSec, marginTop:2 }}>{subtitle}</div>}
          </div>
        )}
        {tel
          ? <TelemetryChart options={chart} height={height}/>
          : <div className="skeleton" style={{ height, borderRadius:8 }}/>
        }
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Tab bar + time range */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:0, background:'#F8FAFC', borderRadius:10, padding:3, border:`1px solid ${BRAND.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:tab===t.id?600:400,
              background: tab===t.id ? '#FFFFFF' : 'transparent',
              color: tab===t.id ? BRAND.blue : BRAND.textSec,
              boxShadow: tab===t.id ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
              transition:'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:4 }}>
          {TIME_RANGES.map(r => (
            <button key={r.label} onClick={() => setRange(r.label)} style={{
              padding:'5px 12px', borderRadius:7, border:`1px solid ${range===r.label?BRAND.blue:BRAND.border}`,
              background: range===r.label ? '#EFF6FF' : '#FFFFFF',
              color: range===r.label ? BRAND.blue : BRAND.textSec,
              fontSize:12, fontWeight:range===r.label?600:400, cursor:'pointer',
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Context bar */}
      <div style={{ fontSize:11, color: BRAND.textMut, display:'flex', alignItems:'center', gap:6 }}>
        <Ic name="clock" size={11} color={BRAND.textMut}/>
        Showing {range} of data for <strong style={{ color: BRAND.text }}>{unit.code}</strong> — {unit.loc}
        {!tel && <span style={{ marginLeft:6, color:'#D97706' }}>(demo data — connect live feed for real-time graphs)</span>}
      </div>

      {/* ── HT Feeder tab ──────────────────────────────────────────── */}
      {tab === 'ht' && (
        <>
          <ChartSection
            title="Active Power"
            subtitle="HT feeder load in kilowatts"
            chart={areaOpts(tel?.htKw, 'Power (kW)', BRAND.blue, 'kW', undefined, undefined, unit.kva * 0.9)}
          />
          <ChartSection
            title="HT Voltage"
            subtitle="Supply voltage — ±5% band is normal (10,450–11,550 V)"
            chart={areaOpts(tel?.htV, 'Voltage (V)', '#7C3AED', 'V', 10000, 12000)}
          />
          <ChartSection
            title="Power Factor"
            subtitle="Green ≥ 0.95 · Amber 0.90–0.95 · Red below 0.90"
            chart={pfZoneOpts(tel?.htPf, 'Power Factor')}
          />
        </>
      )}

      {/* ── Transformer tab ────────────────────────────────────────── */}
      {tab === 'trf' && (
        <>
          <ChartSection
            title="Oil & Winding Temperature"
            subtitle="Warning at 70°C / 100°C · Critical at 85°C / 120°C"
            chart={lineOpts([
              { name:'Oil Temperature (°C)',     data: tel?.oilT,  color:'#D97706' },
              { name:'Winding Temperature (°C)', data: tel?.windT, color:'#DC2626' },
            ], '°C', 20, 150)}
            height={260}
          />
          <ChartSection
            title="OLTC Tap Position"
            subtitle="On-load tap changer position (−8 to +8)"
            chart={stepOpts(tel?.oltc, 'OLTC Position', BRAND.blue)}
          />
        </>
      )}

      {/* ── LT Feeders tab ─────────────────────────────────────────── */}
      {tab === 'lt' && (
        <ChartSection
          title="LT Outgoing Feeder Loads"
          subtitle="Power consumption per feeder — click legend to toggle"
          chart={lineOpts([
            { name:'F1 – EV Zone A', data: tel?.f1Kw, color:'#1B4DB5' },
            { name:'F2 – EV Zone B', data: tel?.f2Kw, color:'#0891B2' },
            { name:'F3 – Auxiliary', data: tel?.f3Kw, color:'#7C3AED' },
            { name:'F4 – Lighting',  data: tel?.f4Kw, color:'#D97706' },
          ], 'kW', 0)}
          height={320}
        />
      )}

      {/* ── APFC tab ───────────────────────────────────────────────── */}
      {tab === 'apfc' && (
        <>
          <ChartSection
            title="Power Factor — Before & After Correction"
            subtitle="Uncorrected (raw) vs. corrected by APFC"
            chart={lineOpts([
              { name:'Uncorrected PF', data: tel?.pfRaw,  color:'#94A3B8' },
              { name:'Corrected PF',   data: tel?.pfCorr, color:'#16A34A', bold:true },
            ], 'Power Factor', 0.6, 1.0)}
            height={240}
          />
          <ChartSection
            title="Reactive Power Balance"
            subtitle="Required kVAR vs. kVAR connected by capacitor banks"
            chart={lineOpts([
              { name:'Required kVAR',  data: tel?.reqKvar,  color:'#DC2626', area:false },
              { name:'Connected kVAR', data: tel?.connKvar, color:'#16A34A', area:true  },
            ], 'kVAR', 0)}
            height={240}
          />
        </>
      )}
    </div>
  );
}

window.Graphs = Graphs;
