// UIComponents.jsx — Shared primitives: constants, icons, badges, charts
const { useState, useEffect, useRef, useMemo } = React;

// ── Brand & Status constants ──────────────────────────────────────────────────
window.BRAND = {
  blue:     '#1B4DB5',
  blueHov:  '#1641A0',
  red:      '#CC1F1F',
  bgPage:   '#F4F6FA',
  bgCard:   '#FFFFFF',
  border:   '#E2E8F0',
  text:     '#1E293B',
  textSec:  '#64748B',
  textMut:  '#94A3B8',
};

window.STATUS = {
  normal:   { color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC', label: 'Normal'   },
  warning:  { color: '#D97706', bg: '#FEF3C7', border: '#FCD34D', label: 'Warning'  },
  critical: { color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5', label: 'Critical' },
  offline:  { color: '#94A3B8', bg: '#F1F5F9', border: '#CBD5E1', label: 'Offline'  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────
window.fmt = {
  timeAgo(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 5000)      return 'Just now';
    if (diff < 60000)     return `${Math.floor(diff/1000)}s ago`;
    if (diff < 3600000)   return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000)  return `${Math.floor(diff/3600000)}h ago`;
    return `${Math.floor(diff/86400000)}d ago`;
  },
  num(n, dec = 0) {
    if (n === null || n === undefined) return '—';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: dec, minimumFractionDigits: dec });
  },
  pf(n) {
    if (!n) return '—';
    return Number(n).toFixed(2);
  },
  date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
};

// ── SVG Icon library ──────────────────────────────────────────────────────────
function Ic({ name, size = 16, color = 'currentColor', className = '' }) {
  const paths = {
    grid:        'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    users:       'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    settings:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    zap:         'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    chevL:       'M15 18l-6-6 6-6',
    chevR:       'M9 18l6-6-6-6',
    chevD:       'M6 9l6 6 6-6',
    logout:      'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    eye:         'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    eyeOff:      'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
    search:      'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
    filter:      'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    plus:        'M12 5v14M5 12h14',
    edit:        'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    x:           'M18 6L6 18M6 6l12 12',
    check:       'M20 6L9 17l-5-5',
    checkCirc:   'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
    alert:       'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
    alertCirc:   'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
    info:        'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
    wifi:        'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
    wifiOff:     'M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
    activity:    'M22 12h-4l-3 9L9 3l-3 9H2',
    fileText:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    shield:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    user:        'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    tool:        'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    arrowR:      'M5 12h14M12 5l7 7-7 7',
    refresh:     'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    clock:       'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
    thermo:      'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
    bell:        'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    circle:      'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    copy:        'M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    disable:     'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM4.93 4.93l14.14 14.14',
  };
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ display:'inline-block', flexShrink:0, verticalAlign:'middle' }}>
      <path d={d}/>
    </svg>
  );
}
window.Ic = Ic;

// ── StatusDot ─────────────────────────────────────────────────────────────────
function StatusDot({ status, size = 8 }) {
  const cfg = STATUS[status] || STATUS.offline;
  return (
    <span
      style={{
        display:'inline-block', width:size, height:size, borderRadius:'50%',
        background: cfg.color, flexShrink:0,
        ...(status==='critical' ? { animation:'pulseDot 1.2s ease-in-out infinite' } : {}),
      }}
    />
  );
}
window.StatusDot = StatusDot;

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS[status] || STATUS.offline;
  const pad = size === 'sm' ? '2px 8px' : '3px 10px';
  const fs  = size === 'sm' ? 11 : 12;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding: pad, borderRadius:99,
      background: cfg.bg, border:`1px solid ${cfg.border}`,
      fontSize: fs, fontWeight:600, color: cfg.color,
      letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap',
    }}>
      <StatusDot status={status} size={size==='sm'?6:7} />
      {cfg.label}
    </span>
  );
}
window.StatusBadge = StatusBadge;

// ── MetricValue ───────────────────────────────────────────────────────────────
function MetricValue({ label, value, unit = '', color = null, size = 'md' }) {
  const valSize = size === 'lg' ? 24 : size === 'sm' ? 13 : 16;
  const lblSize = 10;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ fontSize:lblSize, fontWeight:600, textTransform:'uppercase',
        letterSpacing:'0.06em', color: BRAND.textMut }}>
        {label}
      </span>
      <span className="mono" style={{
        fontSize: valSize, fontWeight:600,
        color: color || BRAND.text,
        lineHeight:1.2,
      }}>
        {value}
        {unit && <span style={{ fontSize: valSize * 0.65, fontWeight:400, color: BRAND.textSec, marginLeft:2 }}>{unit}</span>}
      </span>
    </div>
  );
}
window.MetricValue = MetricValue;

// ── RoleBadge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = {
    admin:   { bg:'#EFF6FF', color:'#1B4DB5', border:'#BFDBFE', label:'Admin'  },
    service: { bg:'#F5F3FF', color:'#7C3AED', border:'#DDD6FE', label:'Service'},
    user:    { bg:'#F8FAFC', color:'#64748B', border:'#E2E8F0', label:'User'   },
  }[role] || { bg:'#F8FAFC', color:'#64748B', border:'#E2E8F0', label: role };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:99,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      fontSize:11, fontWeight:600, color:cfg.color,
      letterSpacing:'0.04em', textTransform:'uppercase',
    }}>
      {role === 'admin' && <Ic name="shield" size={10} color={cfg.color}/>}
      {role === 'service' && <Ic name="tool" size={10} color={cfg.color}/>}
      {role === 'user' && <Ic name="user" size={10} color={cfg.color}/>}
      {cfg.label}
    </span>
  );
}
window.RoleBadge = RoleBadge;

// ── SeverityBadge ─────────────────────────────────────────────────────────────
function SeverityBadge({ sev }) {
  const cfg = {
    critical: { bg:'#FEE2E2', color:'#DC2626', border:'#FCA5A5', label:'Critical' },
    warning:  { bg:'#FEF3C7', color:'#D97706', border:'#FCD34D', label:'Warning'  },
    info:     { bg:'#EFF6FF', color:'#1B4DB5', border:'#BFDBFE', label:'Info'     },
  }[sev] || { bg:'#F8FAFC', color:'#64748B', border:'#E2E8F0', label: sev };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:99,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      fontSize:11, fontWeight:600, color:cfg.color,
      letterSpacing:'0.04em', textTransform:'uppercase',
    }}>
      {sev==='critical' && <Ic name="alertCirc" size={10} color={cfg.color}/>}
      {sev==='warning'  && <Ic name="alert"     size={10} color={cfg.color}/>}
      {sev==='info'     && <Ic name="info"       size={10} color={cfg.color}/>}
      {cfg.label}
    </span>
  );
}
window.SeverityBadge = SeverityBadge;

// ── TelemetryChart (ECharts wrapper) ─────────────────────────────────────────
function TelemetryChart({ options, height = 220, loading = false }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const optStr = useMemo(() => JSON.stringify(options), [options]);

  useEffect(() => {
    if (!containerRef.current || !window.echarts) return;
    const chart = window.echarts.init(containerRef.current, null, { renderer: 'canvas' });
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !options) return;
    chartRef.current.setOption(options, { notMerge: true });
  }, [optStr]);

  if (loading) {
    return <div style={{ width:'100%', height, borderRadius:8 }} className="skeleton"/>;
  }
  return <div ref={containerRef} style={{ width:'100%', height }}/>;
}
window.TelemetryChart = TelemetryChart;

// ── SkeletonCard ──────────────────────────────────────────────────────────────
function SkeletonCard({ height = 180 }) {
  return (
    <div className="card" style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      <div className="skeleton" style={{ height:14, width:'55%' }}/>
      <div className="skeleton" style={{ height:11, width:'35%' }}/>
      <div style={{ height:1, background: BRAND.border, margin:'4px 0' }}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div className="skeleton" style={{ height:9, width:'60%' }}/>
            <div className="skeleton" style={{ height:16, width:'80%' }}/>
          </div>
        ))}
      </div>
    </div>
  );
}
window.SkeletonCard = SkeletonCard;

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,0.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:1000, backdropFilter:'blur(2px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width, maxWidth:'95vw', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(15,23,42,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${BRAND.border}` }}>
          <h3 style={{ fontSize:15, fontWeight:600, color: BRAND.text }}>{title}</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color: BRAND.textSec, display:'flex', padding:4, borderRadius:6 }}>
            <Ic name="x" size={16}/>
          </button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}
window.Modal = Modal;

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon = 'checkCirc', title, sub, color = '#16A34A' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'32px 16px', textAlign:'center' }}>
      <div style={{ width:44, height:44, borderRadius:'50%', background: STATUS.normal.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Ic name={icon} size={20} color={color}/>
      </div>
      <span style={{ fontSize:14, fontWeight:600, color: BRAND.text }}>{title}</span>
      {sub && <span style={{ fontSize:12, color: BRAND.textSec }}>{sub}</span>}
    </div>
  );
}
window.EmptyState = EmptyState;

// ── Chart theme helper ────────────────────────────────────────────────────────
window.chartBase = {
  backgroundColor: 'transparent',
  animation: true,
  animationDuration: 400,
  textStyle: { fontFamily: 'Inter, sans-serif', color: '#64748B' },
  grid: { left: 56, right: 20, top: 24, bottom: 48, containLabel: false },
  xAxis: {
    type: 'time',
    axisLine: { lineStyle: { color: '#E2E8F0' } },
    splitLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94A3B8', fontSize: 11, margin: 10 },
    boundaryGap: false,
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
    axisLabel: { color: '#94A3B8', fontSize: 11 },
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    textStyle: { color: '#F1F5F9', fontSize: 12 },
    axisPointer: { lineStyle: { color: '#475569' } },
  },
};
