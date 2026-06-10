// api.js — Trinity PSS Backend API Service Layer
//
// Backend: http://localhost:3001  (set window.API_BASE to override)
// Auth:    httpOnly cookie (set automatically by browser on login)
//          Token also stored in localStorage for Bearer header fallback.
//
// All fetch calls use credentials:'include' so the cookie is sent automatically.

(function () {
  const API_BASE =
    window.API_BASE ||
    document.querySelector('meta[name="api-base"]')?.content ||
    'http://localhost:3001/api';

  const WS_BASE =
    window.WS_BASE ||
    document.querySelector('meta[name="ws-base"]')?.content ||
    API_BASE.replace(/\/api\/?$/, '');

  // ── Token management (Bearer fallback) ────────────────────────────────────────
  let _token = localStorage.getItem('trinity_token');

  function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (_token) h['Authorization'] = `Bearer ${_token}`;
    return h;
  }

  window.setAuthToken = (token) => {
    _token = token;
    token
      ? localStorage.setItem('trinity_token', token)
      : localStorage.removeItem('trinity_token');
  };

  // ── Fetch wrapper ─────────────────────────────────────────────────────────────
  async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: authHeaders(),
      ...opts,
      headers: { ...authHeaders(), ...(opts.headers ?? {}) },
    });
    if (res.status === 401) {
      window.setAuthToken(null);
      window.location.reload();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || body.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Shape transformers ────────────────────────────────────────────────────────
  // Maps backend response shapes → what the UI components expect.
  // UI field names are kept short for density (code, kva, htKw, oilT, pf…).

  function transformPssList(rows) {
    return rows.map(r => ({
      id:      r.id,
      code:    r.unique_code,
      kva:     r.kva_rating,
      ht:      r.ht_voltage_class,
      loc:     r.location_name,
      locCode: r.location_code,
      status:  r.status,
      seen:    r.last_seen_at,
      htKw:    r.ht_kw     ?? 0,
      ltKw:    r.lt_kw     ?? 0,
      eff:     r.ht_kw > 0 && r.lt_kw > 0
                 ? +((r.lt_kw / r.ht_kw) * 100).toFixed(1)
                 : 0,
      oilT:    r.oil_temp_c  ?? 0,
      pf:      r.corrected_pf ?? 0,
      feeders: +(r.feeder_count ?? 0),
      faults:  Array.isArray(r.active_faults) ? r.active_faults.length : 0,
    }));
  }

  function transformComponent(c) {
    const t = c.component_type;

    if (t === 'HT_VCB') return {
      type:   'HT_VCB',
      id:     c.component_identifier,
      label:  'HT Breaker (VCB)',
      status: c.tripped ? 'critical' : 'normal',
      tripped: !!c.tripped,
      spring:  c.spring_charge_ready !== false,
      relay:   c.relay_ok !== false,
    };

    if (t === 'HT_Feeder') return {
      type:   'HT_Feeder',
      id:     c.component_identifier,
      label:  'HT Metering (EN6400)',
      status: 'normal',
      v:    c.voltage_v,
      a:    c.current_a,
      hz:   c.frequency_hz,
      pf:   c.power_factor,
      kw:   c.kw,
      kvar: c.kvar,
      kwh:  c.kwh,
    };

    if (t === 'TRANSFORMER') return {
      type:   'TRANSFORMER',
      id:     c.component_identifier,
      label:  'Main Transformer',
      status: c.buchholz_alarm || c.prv_tripped
        ? 'critical'
        : c.oil_temp_c > 75 ? 'warning' : 'normal',
      oilT:  c.oil_temp_c,
      windT: c.winding_temp_c,
      mog:   c.mog_ok !== false,
      buch:  !!c.buchholz_alarm,
      prv:   !!c.prv_tripped,
      oltc:  c.oltc_position,
    };

    if (t === 'LT_ACB') return {
      type:   'LT_ACB',
      id:     c.component_identifier,
      label:  'LT Main Breaker (ACB)',
      status: c.tripped ? 'critical' : 'normal',
      tripped: !!c.tripped,
      spring:  c.spring_charge_ready !== false,
      relay:   true,
    };

    if (t === 'LT_FEEDER') return {
      type:   'LT_FEEDER',
      id:     c.component_identifier,
      label:  'LT Bus (415V)',
      status: c.tripped ? 'critical' : 'normal',
      v:    c.voltage_v,
      a:    c.current_a,
      pf:   c.power_factor,
      kw:   c.kw,
      kvar: c.kvar,
    };

    if (t === 'LT_outgoing') return {
      type:    'LT_outgoing',
      id:      c.component_identifier,
      label:   c.display_name || c.load_description || c.component_identifier,
      feeder_id: c.feeder_id,
      status:  c.tripped ? 'critical' : 'normal',
      kw:      c.kw,
      kwh:     c.kwh,
    };

    if (t === 'APFC') return {
      type:     'APFC',
      id:       c.component_identifier,
      label:    'Power Factor Correction',
      status:   'normal',
      pf:       c.power_factor,
      reqKvar:  c.required_kvar,
      connKvar: c.connected_kvar,
      targetPf: c.target_pf,
      corrPf:   c.corrected_pf,
    };

    return { type: t, id: c.component_identifier, label: t, status: 'normal' };
  }

  function transformPssDetail(data) {
    return {
      id:      data.pss?.id,
      code:    data.pss?.unique_code,
      kva:     data.pss?.kva_rating,
      ht:      data.pss?.ht_voltage_class,
      loc:     data.pss?.location_name,
      locCode: data.pss?.location_code,
      status:  data.status,
      seen:    data.last_seen_at,
      components: (data.components ?? []).map(transformComponent),
      faults: (data.active_faults ?? []).map(f => ({
        id:      f.id,
        ts:      f.ts,
        at:      f.ts,            // ActiveFaults panel reads f.at
        sev:     f.severity,
        comp:    f.component_name || f.component_type,
        type:    f.fault_type,
        msg:     f.description || f.summary,
        fStatus: f.status,
      })),
    };
  }

  function transformEvents(rows) {
    return rows.map(e => ({
      id:      e.id,
      ts:      e.ts,
      sev:     e.severity,
      comp:    e.component_name || e.component_type,
      type:    e.event_type,
      msg:     e.summary,
      fStatus: e.fault_status ?? null,
      pssId:   e.pss_id,
      pssCode: e.pss_code ?? null,
      detail:  e.details ?? {},
    }));
  }

  function transformUsers(rows) {
    return rows.map(u => ({
      id:     u.id,
      name:   u.full_name,
      email:  u.email,
      role:   u.role,
      active: u.is_active,
      login:  u.last_login_at,
      access: (u.pss_access ?? []).map(a => a.pss_id),
    }));
  }

  // Merge multi-group telemetry calls into the flat object the graph views expect.
  // Each series is [[isoTimestamp, value], ...]
  function buildTelemetrySeries(htRows, txRows, ltRows, apfcRows) {
    const ts = r => r.ts ?? r.bucket;

    const htKw    = htRows.map(r => [ts(r), r.avg_kw     ?? r.kw     ?? 0]);
    const htV     = htRows.map(r => [ts(r), r.avg_voltage_v ?? (r.metrics?.voltage_v) ?? 0]);
    const htPf    = htRows.map(r => [ts(r), r.avg_pf     ?? r.power_factor ?? 0]);

    const oilT    = txRows.map(r => [ts(r), r.avg_oil_temp_c     ?? r.oil_temp_c     ?? 0]);
    const windT   = txRows.map(r => [ts(r), r.avg_winding_temp_c ?? r.winding_temp_c ?? 0]);
    const oltc    = txRows.map(r => [ts(r), r.oltc_position ?? 0]);

    // LT feeders — separate series per feeder_id
    const feederSeries = {};
    for (const r of ltRows) {
      const key = r.feeder_id ?? r.feeder_code ?? 'f1';
      if (!feederSeries[key]) feederSeries[key] = [];
      feederSeries[key].push([ts(r), r.kw ?? 0]);
    }
    const feederKeys = Object.keys(feederSeries);
    const f1Kw  = feederSeries[feederKeys[0]] ?? [];
    const f2Kw  = feederSeries[feederKeys[1]] ?? [];
    const f3Kw  = feederSeries[feederKeys[2]] ?? [];
    const f4Kw  = feederSeries[feederKeys[3]] ?? [];

    const pfRaw   = apfcRows.map(r => [ts(r), r.power_factor      ?? 0]);
    const pfCorr  = apfcRows.map(r => [ts(r), r.corrected_pf      ?? 0]);
    const reqKvar = apfcRows.map(r => [ts(r), r.required_kvar     ?? 0]);
    const connKvar= apfcRows.map(r => [ts(r), r.connected_kvar    ?? 0]);

    return { htKw, htV, htPf, oilT, windT, oltc, f1Kw, f2Kw, f3Kw, f4Kw, pfRaw, pfCorr, reqKvar, connKvar };
  }

  // ── API surface ────────────────────────────────────────────────────────────────
  window.API = {

    // POST /api/auth/login
    async login(email, password) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Invalid credentials');
      }
      const data = await res.json();
      if (data.token) window.setAuthToken(data.token);
      return data; // { ok, token, user: { id, name, email, role, initials } }
    },

    // POST /api/auth/logout
    async logout() {
      await fetch(`${API_BASE}/auth/logout`, {
        method:      'POST',
        credentials: 'include',
        headers:     authHeaders(),
      }).catch(() => {});
      window.setAuthToken(null);
    },

    // GET /api/me
    async getMe() {
      return apiFetch('/me');
    },

    // GET /api/pss  →  PSS[] (transformed for overview grid)
    async getPss() {
      const rows = await apiFetch('/pss');
      return transformPssList(rows);
    },

    // GET /api/pss/:id  →  detail with flat components[] and faults[]
    async getPssDetail(id) {
      const data = await apiFetch(`/pss/${id}`);
      return transformPssDetail(data);
    },

    // GET /api/pss/:id/events  →  Event[] (transformed)
    async getEvents(pssId = null, limit = 100) {
      if (pssId) {
        const rows = await apiFetch(`/pss/${pssId}/events?limit=${limit}`);
        return transformEvents(rows);
      }
      // Global event log — uses /api/events (admin/service see all)
      const rows = await apiFetch(`/events?limit=${limit}`);
      return transformEvents(rows);
    },

    // GET /api/pss/:id/telemetry (4 group calls, merged into flat series object)
    async getTelemetry(pssId, hours = 24) {
      const to   = new Date().toISOString();
      const from = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const qs   = `from=${from}&to=${to}`;

      const [htRows, txRows, ltRows, apfcRows] = await Promise.all([
        apiFetch(`/pss/${pssId}/telemetry?group=ht&${qs}`).then(r => r.rows ?? []),
        apiFetch(`/pss/${pssId}/telemetry?group=transformer&${qs}`).then(r => r.rows ?? []),
        apiFetch(`/pss/${pssId}/telemetry?group=lt&${qs}`).then(r => r.rows ?? []),
        apiFetch(`/pss/${pssId}/telemetry?group=apfc&${qs}`).then(r => r.rows ?? []),
      ]);

      return buildTelemetrySeries(htRows, txRows, ltRows, apfcRows);
    },

    // GET /api/admin/users  →  User[] (transformed)
    async getUsers() {
      const rows = await apiFetch('/admin/users');
      return transformUsers(rows);
    },

    // POST /api/admin/users
    async createUser(userData) {
      // userData from UI: { name, email, role, active, access: pssId[] }
      const body = {
        full_name: userData.name,
        email:     userData.email,
        role:      userData.role,
        pss_ids:   userData.access ?? [],
      };
      const data = await apiFetch('/admin/users', {
        method: 'POST',
        body:   JSON.stringify(body),
      });
      return {
        user:         transformUsers([data.user])[0],
        tempPassword: data.temp_password,
      };
    },

    // PUT /api/admin/users/:id
    async updateUser(id, userData) {
      const body = {
        full_name: userData.name,
        email:     userData.email,
        role:      userData.role,
      };
      const data = await apiFetch(`/admin/users/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(body),
      });
      return transformUsers([data])[0];
    },

    // PATCH /api/admin/users/:id/status
    async setUserStatus(id, is_active) {
      return apiFetch(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ is_active }),
      });
    },

    // PUT /api/admin/users/:id/pss-access
    async updatePssAccess(id, pss_ids) {
      return apiFetch(`/admin/users/${id}/pss-access`, {
        method: 'PUT',
        body:   JSON.stringify({ pss_ids }),
      });
    },

    // GET /api/pss/:id/thresholds
    async getThresholds(pssId) {
      if (!pssId) return { global: window.DEFAULT_THRESHOLDS, perUnit: {} };
      const data = await apiFetch(`/pss/${pssId}/thresholds`);
      // Map by_type rules to the flat global format the Config screen expects
      const byType = data.by_type ?? {};
      const tx     = byType.TRANSFORMER?.[0]?.rules ?? {};
      const htf    = byType.HT_Feeder?.[0]?.rules   ?? {};
      return {
        global: {
          oilTempWarn:  tx.oil_warn_c        ?? 75,
          oilTempCrit:  tx.oil_critical_c    ?? 85,
          windTempWarn: tx.winding_warn_c    ?? 90,
          windTempCrit: tx.winding_critical_c ?? 100,
          pfMin:        0.92,
          loadPctWarn:  85,
          loadPctCrit:  95,
        },
        perUnit: {},
        raw:     data,
      };
    },

    // POST /api/pss/:id/controls/shutoff
    async requestShutoff(pssId, reason) {
      return apiFetch(`/pss/${pssId}/controls/shutoff`, {
        method: 'POST',
        body:   JSON.stringify({ reason, acknowledged: true }),
      });
    },

    // ── WebSocket — Socket.io ─────────────────────────────────────────────────────
    // Connects to our Socket.io server.
    // Maps our events (fault_log_update, graph_data_update) to what App.jsx expects:
    //   onMessage({ type: 'NEW_EVENT', data: Event })
    //   onStatusChange('live' | 'reconnecting')
    connectWS(onMessage, onStatusChange) {
      if (typeof io === 'undefined') {
        console.warn('[WS] Socket.io not loaded — live updates disabled');
        onStatusChange('reconnecting');
        return { close: () => {} };
      }

      const socket = io(WS_BASE, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: _token ? { token: _token } : {},
      });

      socket.on('connect', () => {
        onStatusChange('live');
        // Join will be called per-PSS from App.jsx via joinRoom()
      });

      socket.on('disconnect', () => onStatusChange('reconnecting'));
      socket.on('connect_error', () => onStatusChange('reconnecting'));

      // Translate fault_log_update → NEW_EVENT notifications for new critical events
      let _lastEventIds = new Set();
      socket.on('fault_log_update', ({ events }) => {
        for (const e of (events ?? [])) {
          if (!_lastEventIds.has(e.id)) {
            _lastEventIds.add(e.id);
            if (e.severity === 'critical' || e.severity === 'warning') {
              onMessage({
                type: 'NEW_EVENT',
                data: {
                  id:      e.id,
                  pssId:   e.pss_id,
                  pssCode: e.pss_code,
                  sev:     e.severity,
                  msg:     e.summary,
                },
              });
            }
          }
        }
        // Also forward raw event for any listener that wants the full list
        onMessage({ type: 'FAULT_LOG', data: events ?? [] });
      });

      socket.on('graph_data_update', (data) => {
        onMessage({ type: 'GRAPH_DATA', data });
      });

      return {
        socket,
        join: (locationCode) => socket.emit('join', { location_code: locationCode }),
        close: () => socket.disconnect(),
      };
    },

    // Thresholds save — maps back to our API (component_thresholds versioning)
    // For now: no-op returning the same object (threshold updates need admin UI flow)
    async saveThresholds(thresholds) {
      // Threshold saves are per-unit; global changes applied to all known PSS
      // For now: no-op with a console note (threshold API requires per-unit pssId)
      console.info('[API] saveThresholds: threshold persistence not yet wired to a specific PSS — changes apply in-session only');
      return thresholds;
    },
  };

  window.DEFAULT_THRESHOLDS = {
    oilTempWarn: 75, oilTempCrit: 85,
    windTempWarn: 90, windTempCrit: 100,
    pfMin: 0.92, loadPctWarn: 85, loadPctCrit: 95,
  };
})();
