// Layout.jsx — Sidebar + Topbar shell
const { useState, useEffect } = React;

function Sidebar({ page, pssId, pss, collapsed, onToggle, onNav, user }) {
  const navItems = [
    { id:'overview',    label:'Overview',       icon:'grid'      },
    { id:'logs',        label:'Event Log',      icon:'fileText'  },
    { id:'admin',       label:'User Management',icon:'users',    adminOnly: true },
    { id:'config',      label:'Configuration',  icon:'settings', adminOnly: true },
  ];

  const W = collapsed ? 64 : 240;

  return (
    <aside style={{
      width: W, minWidth: W, height:'100vh', position:'sticky', top:0,
      background:'#FFFFFF', borderRight:`1px solid ${BRAND.border}`,
      display:'flex', flexDirection:'column', transition:'width 0.2s ease',
      overflow:'hidden', zIndex:100, flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{
        height:60, display:'flex', alignItems:'center',
        padding: collapsed ? '0 16px' : '0 16px',
        borderBottom:`1px solid ${BRAND.border}`, flexShrink:0,
        gap:10, overflow:'hidden',
      }}>
        <img src="assets/trinity-logo.png" style={{ height:28, width: collapsed?28:90, objectFit:'contain', objectPosition:'left', flexShrink:0 }} alt="Trinity"/>
        {!collapsed && (
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:9, fontWeight:600, color: BRAND.textMut, textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
              PSS Monitoring
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'8px 0' }}>
        {/* Static nav items */}
        {navItems.filter(n => !n.adminOnly || user.role === 'admin').map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} style={{
              width:'100%', display:'flex', alignItems:'center',
              gap:10, padding: collapsed ? '10px 20px' : '10px 16px',
              background: active ? '#EFF6FF' : 'transparent',
              border:'none', cursor:'pointer', textAlign:'left',
              borderLeft: active ? `3px solid ${BRAND.blue}` : '3px solid transparent',
              color: active ? BRAND.blue : BRAND.textSec,
              transition:'all 0.15s', position:'relative',
            }}>
              <Ic name={item.icon} size={16} color={active ? BRAND.blue : BRAND.textSec}/>
              {!collapsed && (
                <span style={{ fontSize:13, fontWeight:active?600:400, whiteSpace:'nowrap' }}>{item.label}</span>
              )}
            </button>
          );
        })}

        {/* PSS list */}
        <div style={{
          padding: collapsed ? '8px 0' : '8px 16px 4px',
          fontSize:9, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.08em', color: BRAND.textMut,
          marginTop:8,
        }}>
          {!collapsed ? 'PSS Units' : <div style={{ height:1, background: BRAND.border }}/>}
        </div>

        {pss.map(u => {
          const active = page === 'detail' && pssId === u.id;
          return (
            <button key={u.id} onClick={() => onNav('detail', u.id)} style={{
              width:'100%', display:'flex', alignItems:'center',
              gap:8, padding: collapsed ? '8px 20px' : '8px 16px',
              background: active ? '#EFF6FF' : 'transparent',
              border:'none', cursor:'pointer', textAlign:'left',
              borderLeft: active ? `3px solid ${BRAND.blue}` : '3px solid transparent',
              transition:'all 0.15s', overflow:'hidden',
            }}>
              <StatusDot status={u.status} size={7}/>
              {!collapsed && (
                <span style={{
                  fontSize:12, fontWeight: active?600:400,
                  color: active ? BRAND.blue : BRAND.text,
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  lineHeight:1.3,
                }}>
                  {u.code}
                  <span style={{ display:'block', fontSize:10, color: BRAND.textSec, fontWeight:400 }}>{u.loc}</span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + collapse toggle */}
      <div style={{ borderTop:`1px solid ${BRAND.border}`, flexShrink:0 }}>
        {!collapsed && (
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', background: BRAND.blue,
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700, flexShrink:0,
            }}>
              {user.initials}
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color: BRAND.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
              <RoleBadge role={user.role}/>
            </div>
            <button
              title="Sign out"
              onClick={async () => { try { await window.API?.logout(); } finally { window.location.reload(); } }}
              style={{ background:'transparent', border:'none', cursor:'pointer', padding:6, borderRadius:6, flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.background='#FEE2E2'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <Ic name="logout" size={15} color="#DC2626"/>
            </button>
          </div>
        )}
        <button onClick={onToggle} style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent: collapsed?'center':'flex-start',
          gap:8, padding:'10px 18px',
          background:'transparent', border:'none', cursor:'pointer',
          color: BRAND.textSec, fontSize:12,
          borderTop: collapsed ? 'none' : `1px solid ${BRAND.border}`,
        }}>
          <Ic name={collapsed ? 'chevR' : 'chevL'} size={14} color={BRAND.textSec}/>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ page, pssId, pss, wsStatus, onNav, detailTab, onDetailTab,
  notifications, notifOpen, onNotifOpen, onMarkRead, onMarkAllRead, onCloseNotif }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const unit = pss.find(p => p.id === pssId);

  // Breadcrumb
  let crumb = null;
  if (page === 'overview') crumb = [{ label:'Overview' }];
  else if (page === 'detail')  crumb = [{ label:'Overview', click:() => onNav('overview') }, { label: unit?.code || '—' }];
  else if (page === 'graphs')  crumb = [{ label:'Overview', click:() => onNav('overview') }, { label: unit?.code || '—', click:() => onNav('detail', pssId) }, { label:'Graphs' }];
  else if (page === 'events' && pssId)  crumb = [{ label:'Overview', click:() => onNav('overview') }, { label: unit?.code || '—', click:() => onNav('detail', pssId) }, { label:'Event Log' }];
  else if (page === 'events' && !pssId) crumb = [{ label:'Overview', click:() => onNav('overview') }, { label:'All Events' }];
  else if (page === 'logs')  crumb = [{ label:'Event Log' }];
  else if (page === 'admin')   crumb = [{ label:'User Management' }];
  else if (page === 'config')  crumb = [{ label:'Configuration' }];

  // Detail sub-tabs — only shown when a PSS unit is selected
  const detailTabs = pssId && (page === 'detail' || page === 'graphs' || page === 'events')
    ? [
        { id:'detail',  label:'Overview',     icon:'zap'      },
        { id:'graphs',  label:'Graphs',       icon:'activity' },
        { id:'events',  label:'Event Log',    icon:'fileText' },
      ]
    : null;

  return (
    <header style={{
      height: detailTabs ? 'auto' : 56,
      background:'#FFFFFF',
      borderBottom:`1px solid ${BRAND.border}`,
      flexShrink:0,
    }}>
      <div style={{
        height:56, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 24px',
      }}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {crumb && crumb.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: BRAND.textMut, fontSize:14 }}>/</span>}
              {c.click
                ? <button onClick={c.click} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, fontWeight:i===crumb.length-1?600:400, color: i===crumb.length-1 ? BRAND.text : BRAND.textSec }}>{c.label}</button>
                : <span style={{ fontSize:14, fontWeight:i===crumb.length-1?600:400, color: i===crumb.length-1 ? BRAND.text : BRAND.textSec }}>{c.label}</span>
              }
            </React.Fragment>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* WS status */}
          {wsStatus === 'live' && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#16A34A' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#16A34A', display:'inline-block' }} className="pulse-live"/>
              Live
            </div>
          )}
          {wsStatus === 'reconnecting' && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#D97706' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#D97706', display:'inline-block' }}/>
              Reconnecting…
            </div>
          )}

          {/* Notifications bell + dropdown */}
          <div style={{ position:'relative' }}>
            <NotificationBell
              notifications={notifications || []}
              onOpen={onNotifOpen}
              isOpen={notifOpen}
            />
            {notifOpen && (
              <NotificationDropdown
                notifications={notifications || []}
                onMarkRead={onMarkRead}
                onMarkAll={onMarkAllRead}
                onClose={onCloseNotif}
                onNav={onNav}
              />
            )}
          </div>

          {/* Timestamp */}
          <span style={{ fontSize:11, color: BRAND.textMut }} className="mono">
            {now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
          </span>
        </div>
      </div>

      {/* Sub-tabs for PSS detail pages */}
      {detailTabs && (
        <div style={{ display:'flex', gap:0, padding:'0 24px', borderTop:`1px solid ${BRAND.border}` }}>
          {detailTabs.map(tab => {
            const active = detailTab === tab.id || page === tab.id;
            return (
              <button key={tab.id} onClick={() => onDetailTab(tab.id)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'10px 14px', background:'transparent', border:'none',
                borderBottom: active ? `2px solid ${BRAND.blue}` : '2px solid transparent',
                cursor:'pointer', fontSize:13,
                color: active ? BRAND.blue : BRAND.textSec,
                fontWeight: active ? 600 : 400,
                marginBottom:-1,
                transition:'all 0.15s',
              }}>
                <Ic name={tab.icon} size={14} color={active ? BRAND.blue : BRAND.textSec}/>
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

Object.assign(window, { Sidebar, Topbar });
