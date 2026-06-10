// Events.jsx — Fault / Event log table
const { useState } = React;

function Events({ pssId, pss, events }) {
  const [sevFilter,  setSevFilter]  = useState('all');
  const [compFilter, setCompFilter] = useState('all');
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState(null);
  const [page,       setPage]       = useState(1);

  const ROWS_PER_PAGE = 15;
  const unit = pss.find(p => p.id === pssId);

  // All unique components in events for this PSS
  const allComps = [...new Set(events.filter(e => !pssId || e.pssId === pssId).map(e => e.comp))];

  // Filter events
  const filtered = events
    .filter(e => !pssId || e.pssId === pssId)
    .filter(e => sevFilter  === 'all' || e.sev  === sevFilter)
    .filter(e => compFilter === 'all' || e.comp === compFilter)
    .filter(e => {
      const q = search.toLowerCase();
      return !q || e.msg.toLowerCase().includes(q) || e.comp.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
    })
    .sort((a,b) => new Date(b.ts) - new Date(a.ts));

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paged = filtered.slice((page-1)*ROWS_PER_PAGE, page*ROWS_PER_PAGE);

  const sevColors = {
    critical: STATUS.critical,
    warning:  STATUS.warning,
    info:     { color:'#1B4DB5', bg:'#EFF6FF', border:'#BFDBFE' },
  };

  function EventRow({ ev }) {
    const open = expanded === ev.id;
    const sc   = sevColors[ev.sev] || sevColors.info;
    return (
      <>
        <tr onClick={() => setExpanded(open ? null : ev.id)} style={{
          cursor:'pointer',
          background: open ? '#F8FAFC' : undefined,
          borderLeft: ev.fStatus === 'active' ? `3px solid ${STATUS.critical.color}` : '3px solid transparent',
        }}>
          <td>
            <div className="mono" style={{ fontSize:11, color: BRAND.text, whiteSpace:'nowrap' }}>
              {new Date(ev.ts).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
            </div>
            <div style={{ fontSize:10, color: BRAND.textMut, marginTop:1 }}>{fmt.timeAgo(ev.ts)}</div>
          </td>
          <td><SeverityBadge sev={ev.sev}/></td>
          <td>
            <span style={{ fontSize:11, fontWeight:600, color: BRAND.text, fontFamily:'monospace',
              background:'#F8FAFC', border:`1px solid ${BRAND.border}`, borderRadius:4, padding:'2px 6px' }}>
              {ev.comp}
            </span>
          </td>
          <td>
            <span style={{ fontSize:10, fontWeight:600, color: BRAND.textSec, textTransform:'uppercase',
              letterSpacing:'0.04em' }}>{ev.type.replace(/_/g,' ')}</span>
          </td>
          <td style={{ maxWidth:280 }}>
            <span style={{ fontSize:12, color: BRAND.text, lineHeight:1.4, display:'block',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.msg}</span>
          </td>
          <td>
            {ev.fStatus === 'active' && (
              <span style={{ fontSize:10, fontWeight:600, background: STATUS.critical.bg,
                color: STATUS.critical.color, border:`1px solid ${STATUS.critical.border}`,
                borderRadius:99, padding:'2px 7px' }}>Active</span>
            )}
            {ev.fStatus === 'cleared' && (
              <span style={{ fontSize:10, fontWeight:600, background:'#F8FAFC',
                color: BRAND.textSec, border:`1px solid ${BRAND.border}`,
                borderRadius:99, padding:'2px 7px' }}>Cleared</span>
            )}
          </td>
          <td>
            <Ic name={open ? 'chevD' : 'chevR'} size={13} color={BRAND.textMut}/>
          </td>
        </tr>

        {/* Expanded detail row */}
        {open && (
          <tr>
            <td colSpan={7} style={{ background:'#F8FAFC', padding:'10px 16px 14px', borderBottom:`2px solid ${BRAND.border}` }}>
              <div style={{ fontSize:11, fontWeight:600, color: BRAND.textMut, textTransform:'uppercase',
                letterSpacing:'0.06em', marginBottom:8 }}>Event Details</div>
              <p style={{ fontSize:13, color: BRAND.text, lineHeight:1.6, marginBottom:12 }}>{ev.msg}</p>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                {Object.entries(ev.detail || {}).map(([k,v]) => (
                  <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <span style={{ fontSize:9, fontWeight:700, color: BRAND.textMut, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {k.replace(/_/g,' ')}
                    </span>
                    <span className="mono" style={{ fontSize:12, fontWeight:600, color: BRAND.text }}>
                      {typeof v === 'number' ? v.toLocaleString('en-IN') : String(v)}
                    </span>
                  </div>
                ))}
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <span style={{ fontSize:9, fontWeight:700, color: BRAND.textMut, textTransform:'uppercase', letterSpacing:'0.06em' }}>PSS Unit</span>
                  <span className="mono" style={{ fontSize:12, fontWeight:600, color: BRAND.text }}>{ev.pssCode}</span>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Filter bar */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:'1 1 200px', maxWidth:280 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
            <Ic name="search" size={13} color={BRAND.textMut}/>
          </span>
          <input type="text" placeholder="Search events…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft:32, fontSize:13 }}/>
        </div>

        {/* Severity filter */}
        <select value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1); }}
          style={{ flex:'none', width:'auto', fontSize:13, padding:'7px 12px' }}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        {/* Component filter */}
        <select value={compFilter} onChange={e => { setCompFilter(e.target.value); setPage(1); }}
          style={{ flex:'none', width:'auto', fontSize:13, padding:'7px 12px' }}>
          <option value="all">All Components</option>
          {allComps.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <span style={{ fontSize:11, color: BRAND.textMut, marginLeft:'auto' }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          {unit ? ` · ${unit.code}` : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow:'hidden', flex:1 }}>
        {paged.length === 0 ? (
          <EmptyState icon="fileText" title="No events found" sub="Try adjusting your filters" color={BRAND.textMut}/>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width:130 }}>Timestamp</th>
                  <th style={{ width:90  }}>Severity</th>
                  <th style={{ width:130 }}>Component</th>
                  <th style={{ width:150 }}>Event Type</th>
                  <th>Summary</th>
                  <th style={{ width:80  }}>Status</th>
                  <th style={{ width:30  }}></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(ev => <EventRow key={ev.id} ev={ev}/>)}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding:'10px 16px', borderTop:`1px solid ${BRAND.border}`,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <span style={{ fontSize:11, color: BRAND.textMut }}>
              Page {page} of {totalPages} · {filtered.length} total events
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn-ghost" disabled={page === 1}
                onClick={() => setPage(p => p-1)} style={{ padding:'5px 12px', fontSize:12 }}>
                ← Prev
              </button>
              <button className="btn-ghost" disabled={page === totalPages}
                onClick={() => setPage(p => p+1)} style={{ padding:'5px 12px', fontSize:12 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.Events = Events;
