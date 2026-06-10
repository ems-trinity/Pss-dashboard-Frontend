// Overview.jsx — Stats + 2 swappable live charts + unit status table
const { useState, useEffect, useMemo } = React;

const PALETTE = ['#1B4DB5','#D97706','#DC2626','#7C3AED','#0891B2','#16A34A','#EC4899'];
const short = u => u.code.split('-').pop();

function seedHist(unit) {
  if (unit.status === 'offline') return { kw:[], oilT:[], pf:[] };
  return {
    kw:   Array.from({length:60},(_,i)=>{ const t=new Date(Date.now()-(60-i)*30000); return [t.toISOString(), Math.max(0,Math.round(unit.htKw+(Math.random()-.5)*unit.htKw*0.06))]; }),
    oilT: Array.from({length:60},(_,i)=>{ const t=new Date(Date.now()-(60-i)*30000); return [t.toISOString(), +(unit.oilT+(Math.random()-.5)*2).toFixed(1)]; }),
    pf:   Array.from({length:60},(_,i)=>{ const t=new Date(Date.now()-(60-i)*30000); return [t.toISOString(), +Math.min(1,Math.max(0.7,unit.pf+(Math.random()-.5)*0.02)).toFixed(3)]; }),
  };
}

const XAXIS_OPTS = {
  splitNumber: 4,
  axisLabel: {
    color:'#94A3B8', fontSize:10, margin:8, hideOverlap:true,
    formatter: val => { const d=new Date(val); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); },
  },
};

function buildOpts(type, hist, pss) {
  const online = pss.filter(u => u.status !== 'offline');

  // Multi-line time series base
  function timeChart(dataKey, yName, yMin, yMax, areaFill) {
    return {
      ...chartBase,
      legend: { data:online.map(u=>short(u)), bottom:0, icon:'circle', itemWidth:8, itemHeight:8, textStyle:{fontSize:10,color:'#64748B'} },
      grid: { left:52, right:16, top:12, bottom:44 },
      xAxis: { ...chartBase.xAxis, ...XAXIS_OPTS },
      yAxis: { ...chartBase.yAxis, scale: yMin===undefined, name:yName, nameTextStyle:{color:'#94A3B8',fontSize:10}, ...(yMin!==undefined?{min:yMin,max:yMax}:{}) },
      tooltip: {
        ...chartBase.tooltip,
        formatter: params => {
          const d = params[0] ? new Date(params[0].value[0]) : null;
          const t = d ? d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0') : '';
          return '<div style="font-size:11px;color:#94A3B8;margin-bottom:4px">'+t+'</div>' +
            params.map(p=>'<div style="display:flex;gap:8px;align-items:center;font-size:12px;padding:1px 0"><span style="width:8px;height:8px;border-radius:50%;background:'+p.color+';display:inline-block;flex-shrink:0"></span><span style="color:#94A3B8">'+p.seriesName+'</span>&nbsp;<b style="color:#F1F5F9">'+p.value[1]+'</b></div>').join('');
        },
      },
      series: online.map((u,i)=>({
        name:short(u), type:'line', data:hist[u.id]?.[dataKey]||[], smooth:true, symbol:'none',
        lineStyle:{color:PALETTE[i%PALETTE.length],width:2},
        ...(areaFill ? { areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:PALETTE[i%PALETTE.length]+'28'},{offset:1,color:PALETTE[i%PALETTE.length]+'00'}]}} } : {}),
      })),
    };
  }

  if (type === 'powerFlow') return timeChart('kw',   'kW',  undefined, undefined, true);
  if (type === 'oilTemp')   return timeChart('oilT', '°C',  undefined, undefined, false);
  if (type === 'pf')        return timeChart('pf',   'PF',  0.8,       1.0,       false);

  if (type === 'load') {
    return {
      backgroundColor:'transparent',
      tooltip:{ ...chartBase.tooltip, formatter: p => '<b>'+p.name+'</b>: '+(p.value||0).toLocaleString('en-IN')+' kW' },
      grid:{ left:28, right:20, top:8, bottom:16, containLabel:true },
      xAxis:{ type:'value', axisLabel:{color:'#94A3B8',fontSize:10}, splitLine:{lineStyle:{color:'#F1F5F9',type:'dashed'}}, axisLine:{lineStyle:{color:'#E2E8F0'}} },
      yAxis:{ type:'category', data:online.map(u=>short(u)), axisLabel:{color:'#64748B',fontSize:11,fontWeight:600}, axisLine:{show:false}, axisTick:{show:false} },
      series:[{ type:'bar', barWidth:16, data:online.map((u,i)=>({ name:u.code, value:u.htKw, itemStyle:{color:PALETTE[i%PALETTE.length],borderRadius:3} })) }],
    };
  }
  return {};
}

const CHART_TYPES = [
  { id:'powerFlow', label:'Power Flow', sub:'HT input kW over time'        },
  { id:'oilTemp',   label:'Temperature',sub:'Transformer oil temp °C'       },
  { id:'pf',        label:'Power Factor',sub:'Corrected PF trend'           },
  { id:'load',      label:'Current Load', sub:'Snapshot kW per unit'        },
];

function ChartPanel({ type, onTypeChange, hist, pss }) {
  const opts = useMemo(() => buildOpts(type, hist, pss), [type, hist, pss]);
  const meta = CHART_TYPES.find(c=>c.id===type);
  const isLive = type !== 'load';

  return (
    <div className="card" style={{ padding:'14px 16px 12px', flex:1, minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12, gap:8 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:BRAND.text }}>{meta?.label}</div>
          <div style={{ fontSize:10, color:BRAND.textSec, marginTop:2 }}>{meta?.sub}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          {isLive && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, color:'#16A34A' }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'#16A34A',display:'inline-block' }} className="pulse-live"/>Live
            </span>
          )}
          <div style={{ display:'flex', gap:3 }}>
            {CHART_TYPES.map(c => (
              <button key={c.id} onClick={()=>onTypeChange(c.id)} style={{
                padding:'3px 9px', borderRadius:6, border:'none', cursor:'pointer',
                fontSize:10, fontWeight:type===c.id?700:400,
                background:type===c.id?BRAND.blue:'#F1F5F9',
                color:type===c.id?'#fff':BRAND.textSec,
                transition:'all 0.15s',
              }}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>
      <TelemetryChart options={opts} height={210}/>
    </div>
  );
}

function Overview({ pss, onNav }) {
  const [statusF, setStatusF]   = useState('all');
  const [chart1,  setChart1]    = useState('powerFlow');
  const [chart2,  setChart2]    = useState('oilTemp');

  const [hist, setHist] = useState(() =>
    Object.fromEntries(pss.map(u => [u.id, seedHist(u)]))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setHist(prev => {
        const next = {...prev};
        pss.forEach(u => {
          if (u.status === 'offline') return;
          const p = prev[u.id] || {kw:[],oilT:[],pf:[]};
          const now = new Date().toISOString();
          next[u.id] = {
            kw:   [...p.kw.slice(-59),   [now, u.htKw]],
            oilT: [...p.oilT.slice(-59), [now, u.oilT]],
            pf:   [...p.pf.slice(-59),   [now, u.pf]],
          };
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [pss]);

  const counts   = { all:pss.length };
  pss.forEach(u => { counts[u.status]=(counts[u.status]||0)+1; });
  const totalKw  = pss.filter(u=>u.status!=='offline').reduce((s,u)=>s+u.htKw,0);
  const filtered = pss.filter(u => statusF==='all' || u.status===statusF);

  const filterBtns = [
    { key:'all',      label:`All ${pss.length}`,                            color:BRAND.blue },
    { key:'normal',   label:`Normal ${counts.normal||0}`,                   color:'#16A34A'  },
    { key:'warning',  label:`Warning ${counts.warning||0}`,                 color:'#D97706'  },
    { key:'critical', label:`Critical ${counts.critical||0}`,               color:'#DC2626'  },
    { key:'offline',  label:`Offline ${counts.offline||0}`,                 color:'#94A3B8'  },
  ];

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── Summary strip ─────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {[
          { label:'Total Units',     value:pss.length,                                   icon:'zap',       color:BRAND.blue, bg:'#EFF6FF' },
          { label:'Total Power',     value:`${fmt.num(totalKw)} kW`,                     icon:'activity',  color:'#7C3AED',  bg:'#F5F3FF' },
          { label:'Normal',          value:counts.normal||0,                             icon:'checkCirc', color:'#16A34A',  bg:'#DCFCE7' },
          { label:'Needs Attention', value:(counts.warning||0)+(counts.critical||0),     icon:'alert',     color:'#D97706',  bg:'#FEF3C7' },
          { label:'Offline',         value:counts.offline||0,                            icon:'wifiOff',   color:'#94A3B8',  bg:'#F1F5F9' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Ic name={s.icon} size={15} color={s.color}/>
            </div>
            <div>
              <div className="mono" style={{ fontSize:20, fontWeight:700, color:BRAND.text, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:BRAND.textSec, marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two swappable charts ───────────────────────────────────────── */}
      <div style={{ display:'flex', gap:14 }}>
        <ChartPanel type={chart1} onTypeChange={setChart1} hist={hist} pss={pss}/>
        <ChartPanel type={chart2} onTypeChange={setChart2} hist={hist} pss={pss}/>
      </div>

      {/* ── Unit Status Table ──────────────────────────────────────────── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:BRAND.text }}>Unit Status</span>
          <div style={{ display:'flex', gap:5 }}>
            {filterBtns.map(f => {
              const active = statusF===f.key;
              return (
                <button key={f.key} onClick={()=>setStatusF(f.key)} style={{
                  padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer',
                  fontSize:11, fontWeight:active?700:500,
                  background:active?f.color:'#F1F5F9',
                  color:active?'#fff':BRAND.textSec, transition:'all 0.15s',
                }}>{f.label}</button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ overflow:'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width:90  }}>Status</th>
                <th>Unit Code</th>
                <th>Location</th>
                <th style={{ textAlign:'right', width:110 }}>Power (kW)</th>
                <th style={{ textAlign:'right', width:110 }}>Oil Temp</th>
                <th style={{ textAlign:'right', width:110 }}>Power Factor</th>
                <th style={{ textAlign:'center', width:70 }}>Faults</th>
                <th style={{ width:100 }}>Last Seen</th>
                <th style={{ width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const off = u.status==='offline';
                const lB  = u.status==='critical' ? `3px solid ${STATUS.critical.color}` : u.status==='warning' ? `3px solid ${STATUS.warning.color}` : '3px solid transparent';
                const rBg = u.status==='critical' ? 'rgba(220,38,38,0.02)' : u.status==='warning' ? 'rgba(217,119,6,0.015)' : undefined;
                return (
                  <tr key={u.id} onClick={()=>onNav('detail',u.id)} style={{ cursor:'pointer', background:rBg, borderLeft:lB }}>
                    <td><StatusBadge status={u.status}/></td>
                    <td><span className="mono" style={{ fontSize:12, fontWeight:700, color:BRAND.text }}>{u.code}</span></td>
                    <td><span style={{ fontSize:12, color:BRAND.textSec }}>{u.loc}</span></td>
                    <td style={{ textAlign:'right' }}>
                      <span className="mono" style={{ fontSize:13, fontWeight:600, color:off?BRAND.textMut:BRAND.text }}>{off?'—':fmt.num(u.htKw)}</span>
                    </td>
                    <td style={{ textAlign:'right' }}>
                      <span className="mono" style={{ fontSize:13, fontWeight:600, color:off?BRAND.textMut:u.oilT>=85?STATUS.critical.color:u.oilT>=70?STATUS.warning.color:'#16A34A' }}>
                        {off?'—':`${u.oilT.toFixed(1)}°C`}
                      </span>
                    </td>
                    <td style={{ textAlign:'right' }}>
                      <span className="mono" style={{ fontSize:13, fontWeight:600, color:off?BRAND.textMut:u.pf>=0.95?'#16A34A':u.pf>=0.9?STATUS.warning.color:STATUS.critical.color }}>
                        {off?'—':fmt.pf(u.pf)}
                      </span>
                    </td>
                    <td style={{ textAlign:'center' }}>
                      {u.faults>0
                        ? <span style={{ fontSize:11, fontWeight:700, background:STATUS.critical.bg, color:STATUS.critical.color, border:`1px solid ${STATUS.critical.border}`, borderRadius:99, padding:'2px 7px' }}>{u.faults}</span>
                        : <Ic name="check" size={13} color="#16A34A"/>
                      }
                    </td>
                    <td><span className="mono" style={{ fontSize:11, color:BRAND.textMut }}>{fmt.timeAgo(u.seen)}</span></td>
                    <td style={{ paddingRight:16 }}><Ic name="arrowR" size={14} color={BRAND.blue}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Overview });
