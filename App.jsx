// App.jsx — Main app shell: routing, state, live simulation / WebSocket
const { useState, useEffect, useCallback, useRef } = React;

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND SWITCH
// Set to true once your backend is running and API_BASE is configured.
// See README.md for setup instructions.
// ─────────────────────────────────────────────────────────────────────────────
const USE_LIVE_API = true;

function App() {
  const md = window.MOCK_DATA; // only used when USE_LIVE_API = false

  const [loggedIn,  setLoggedIn]  = useState(false);
  const [page,      setPage]      = useState('overview');
  const [pssId,     setPssId]     = useState(null);
  const [detailTab, setDetailTab] = useState('detail');
  const [collapsed, setCollapsed] = useState(false);
  const [wsStatus,  setWsStatus]  = useState('live');

  // Core data — seeded from mock; replaced by API on login when USE_LIVE_API = true
  const [pss,      setPss]      = useState(md.pss);
  const [detail]                = useState(md.detail);   // TODO: fetch per-unit on demand
  const [events]                = useState(md.events);   // TODO: make stateful for live events
  const [users]                 = useState(md.users);
  const [telemetry]             = useState(md.telemetry);
  const [currentUser, setCurrentUser] = useState(md.user);

  // ── Thresholds ─────────────────────────────────────────────────────────────
  const [thresholds, setThresholds] = useState({
    global:  { ...window.DEFAULT_THRESHOLDS },
    perUnit: {},
  });
  const thresholdsRef = useRef(thresholds);
  useEffect(() => { thresholdsRef.current = thresholds; }, [thresholds]);

  // Persist threshold changes to backend when in live mode
  async function handleSaveThresholds(newThresholds) {
    setThresholds(newThresholds);
    if (USE_LIVE_API) {
      try { await window.API.saveThresholds(newThresholds); }
      catch (err) { console.error('[API] Failed to save thresholds:', err); }
    }
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(() =>
    md.events
      .filter(e => e.sev !== 'info')
      .map((e, i) => ({
        id: e.id, pssId: e.pssId, pssCode: e.pssCode,
        sev: e.sev, msg: e.msg, at: e.ts,
        read: i > 2 || e.fStatus === 'cleared',
      }))
  );
  const [toasts,    setToasts]    = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const addNotification = useCallback((n) => {
    const id      = 'N' + Date.now();
    const toastId = 'T' + Date.now();
    const newN    = { ...n, id, at: new Date().toISOString(), read: false };
    setNotifications(prev => [newN, ...prev].slice(0, 40));
    setToasts(prev => [...prev, { ...newN, toastId }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 6000);
  }, []);

  const markRead     = useCallback(id => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead  = useCallback(()  => setNotifications(p => p.map(n => ({ ...n, read: true }))), []);
  const dismissToast = useCallback(id => setToasts(p => p.filter(t => t.toastId !== id)), []);

  // ── Login handler ──────────────────────────────────────────────────────────
  // Returns a Promise — Login.jsx awaits it and shows errors on rejection
  const handleLogin = useCallback(async (email, password) => {
    if (!USE_LIVE_API) {
      // ── Mock auth ──────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 900));
      if (password !== 'demo' && password !== 'trinity123') {
        throw new Error('Invalid credentials. Try password: demo');
      }
      setLoggedIn(true);
      return;
    }

    // ── Live API auth ──────────────────────────────────────────────────────
    // Throws on failure — Login.jsx catches and displays the message
    const data = await window.API.login(email, password);
    if (data.user) setCurrentUser(data.user);
    setLoggedIn(true);
  }, []);

  // ── Load initial data from API (live mode only) ────────────────────────────
  useEffect(() => {
    if (!loggedIn || !USE_LIVE_API) return;

    (async () => {
      try {
        const [pssData, threshData] = await Promise.all([
          window.API.getPss(),
          window.API.getThresholds(),
        ]);
        setPss(pssData);
        setThresholds(threshData);
        // TODO: also fetch events and users when you have those endpoints ready
      } catch (err) {
        console.error('[API] Initial data load failed:', err);
      }
    })();
  }, [loggedIn]);

  // ── WebSocket — live mode ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loggedIn || !USE_LIVE_API) return;

    const ws = window.API.connectWS(
      (msg) => {
        if (msg.type === 'PSS_UPDATE') {
          setPss(msg.data);
        } else if (msg.type === 'PSS_PATCH') {
          setPss(prev => prev.map(u => u.id === msg.data.id ? { ...u, ...msg.data } : u));
        } else if (msg.type === 'NEW_EVENT') {
          addNotification({
            pssId:   msg.data.pssId,
            pssCode: msg.data.pssCode,
            sev:     msg.data.sev,
            msg:     msg.data.msg,
          });
        }
      },
      (status) => setWsStatus(status)
    );

    return () => ws.close();
  }, [loggedIn, addNotification]);

  // ── Mock simulation — development mode only ────────────────────────────────
  const pssRef      = useRef(md.pss);
  const cooldownRef = useRef({});
  useEffect(() => { pssRef.current = pss; }, [pss]);

  useEffect(() => {
    if (!loggedIn || USE_LIVE_API) return; // disabled in live mode

    const tick = setInterval(() => {
      // Threshold check on last-known values (before jitter)
      const now = Date.now();
      pssRef.current.forEach(u => {
        if (u.status === 'offline') return;
        if (now - (cooldownRef.current[u.id] || 0) < 45000) return; // 45s cooldown per unit

        const thresh = {
          ...window.DEFAULT_THRESHOLDS,
          ...thresholdsRef.current.global,
          ...(thresholdsRef.current.perUnit[u.id] || {}),
        };

        if (u.oilT >= thresh.oilTempCrit && Math.random() < 0.02) {
          cooldownRef.current[u.id] = now;
          addNotification({
            pssId: u.id, pssCode: u.code, sev: 'critical',
            msg: `Oil temperature ${u.oilT}°C exceeded critical limit (${thresh.oilTempCrit}°C) at ${u.loc}.`,
          });
        } else if (u.oilT >= thresh.oilTempWarn && Math.random() < 0.018) {
          cooldownRef.current[u.id] = now;
          addNotification({
            pssId: u.id, pssCode: u.code, sev: 'warning',
            msg: `Oil temperature ${u.oilT}°C approaching warning limit (${thresh.oilTempWarn}°C) at ${u.loc}.`,
          });
        } else if (u.pf < thresh.pfMin && Math.random() < 0.018) {
          cooldownRef.current[u.id] = now;
          addNotification({
            pssId: u.id, pssCode: u.code, sev: 'warning',
            msg: `Power factor ${fmt.pf(u.pf)} below minimum (${thresh.pfMin.toFixed(2)}) at ${u.loc}.`,
          });
        }
      });

      // Apply jitter
      setPss(prev => prev.map(u => {
        if (u.status === 'offline') return u;
        const jitter = v => v + (Math.random() - 0.5) * v * 0.012;
        return {
          ...u,
          htKw: +(jitter(u.htKw)).toFixed(0),
          ltKw: +(jitter(u.ltKw)).toFixed(0),
          oilT: +(u.oilT + (Math.random() - 0.48) * 0.3).toFixed(1),
          pf:   +Math.min(1, Math.max(0.7, u.pf + (Math.random() - 0.5) * 0.005)).toFixed(3),
          seen: new Date().toISOString(),
        };
      }));

      if (Math.random() < 0.003) {
        setWsStatus('reconnecting');
        setTimeout(() => setWsStatus('live'), 2500);
      }
    }, 3000);

    return () => clearInterval(tick);
  }, [loggedIn, addNotification]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const nav = useCallback((dest, id = null) => {
    setNotifOpen(false);
    if (dest === 'detail' || dest === 'graphs') {
      setPssId(id || pssId);
      setPage(dest);
      setDetailTab(dest);
    } else if (dest === 'events') {
      setPssId(id !== undefined ? id : pssId);
      setPage('events');
      setDetailTab('events');
    } else {
      setPage(dest);
    }
  }, [pssId]);

  const handleDetailTab = useCallback((tab) => {
    setDetailTab(tab);
    setPage(tab);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!loggedIn) return <Login onLogin={handleLogin} />;

  function renderContent() {
    switch (page) {
      case 'overview':
        return <Overview pss={pss} onNav={nav} />;

      case 'detail':
        return <PssDetail pssId={pssId} pss={pss} detail={detail} onNav={nav} userRole={currentUser.role} />;

      case 'graphs':
        return <Graphs pssId={pssId} pss={pss} telemetry={telemetry} />;

      case 'events':
        return <Events pssId={pssId} pss={pss} events={events} />;

      case 'admin':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${BRAND.border}`, background: '#FFFFFF' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.text }}>User Management</div>
              <div style={{ fontSize: 12, color: BRAND.textSec, marginTop: 2 }}>Manage accounts and PSS access permissions</div>
            </div>
            <AdminUsers pss={pss} users={users} />
          </div>
        );

      case 'logs':
        return <Events pssId={null} pss={pss} events={events} />;

      case 'config':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', borderBottom: `1px solid ${BRAND.border}`, background: '#FFFFFF', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.text }}>Threshold Configuration</div>
              <div style={{ fontSize: 12, color: BRAND.textSec, marginTop: 2 }}>Configure warning and critical alert limits per PSS unit</div>
            </div>
            <Config pss={pss} thresholds={thresholds} onSave={handleSaveThresholds} />
          </div>
        );

      default:
        return <Overview pss={pss} onNav={nav} />;
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: BRAND.bgPage }}>
      <Sidebar
        page={page} pssId={pssId} pss={pss}
        collapsed={collapsed} onToggle={() => setCollapsed(v => !v)}
        onNav={nav} user={currentUser}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar
          page={page} pssId={pssId} pss={pss}
          wsStatus={wsStatus} onNav={nav}
          detailTab={detailTab} onDetailTab={handleDetailTab}
          notifications={notifications}
          notifOpen={notifOpen}
          onNotifOpen={() => setNotifOpen(v => !v)}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onCloseNotif={() => setNotifOpen(false)}
        />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {renderContent()}
        </main>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
