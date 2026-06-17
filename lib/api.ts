'use client';

import type { Pss, PssEvent, User, Thresholds, ThresholdValues, TelemetrySeries, AuthUser } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001/api';
export const WS_BASE = API_BASE.replace(/\/api\/?$/, '');

let _token: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('trinity_token') : null;

export function setAuthToken(token: string | null) {
  _token = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('trinity_token', token);
    } else {
      localStorage.removeItem('trinity_token');
    }
  }
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) h['Authorization'] = `Bearer ${_token}`;
  return h;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...opts,
    headers: { ...authHeaders(), ...((opts.headers as Record<string, string>) ?? {}) },
  });
  if (res.status === 401) {
    setAuthToken(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(body.error ?? body.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Transformers ──────────────────────────────────────────────────────────────

function transformPssList(rows: Record<string, unknown>[]): Pss[] {
  return rows.map(r => ({
    id:      r.id as string,
    code:    r.unique_code as string,
    kva:     r.kva_rating as number,
    ht:      r.ht_voltage_class as string,
    loc:     r.location_name as string,
    locCode: r.location_code as string,
    status:  r.status as Pss['status'],
    seen:    (r.last_seen_at ?? null) as string | null,
    htKw:    (r.ht_kw as number) ?? 0,
    ltKw:    (r.lt_kw as number) ?? 0,
    eff:     (r.ht_kw as number) > 0 && (r.lt_kw as number) > 0
               ? +((r.lt_kw as number) / (r.ht_kw as number) * 100).toFixed(1)
               : 0,
    oilT:    (r.oil_temp_c as number) ?? 0,
    pf:      (r.corrected_pf as number) ?? 0,
    feeders: +((r.feeder_count as number) ?? 0),
    faults:  Array.isArray(r.active_faults) ? (r.active_faults as unknown[]).length : 0,
  }));
}

function transformEvents(rows: Record<string, unknown>[]): PssEvent[] {
  return rows.map(e => ({
    id:      e.id as string,
    ts:      e.ts as string,
    sev:     e.severity as PssEvent['sev'],
    comp:    ((e.component_name ?? e.component_type) as string),
    type:    e.event_type as string,
    msg:     e.summary as string,
    fStatus: (e.fault_status ?? null) as string | null,
    pssId:   e.pss_id as string,
    pssCode: (e.pss_code ?? null) as string | null,
    detail:  (e.details ?? {}) as Record<string, unknown>,
  }));
}

function transformUsers(rows: Record<string, unknown>[]): User[] {
  return rows.map(u => ({
    id:     u.id as string,
    name:   u.full_name as string,
    email:  u.email as string,
    role:   u.role as User['role'],
    active: u.is_active as boolean,
    login:  (u.last_login_at ?? null) as string | null,
    access: ((u.pss_access as { pss_id: string }[]) ?? []).map(a => a.pss_id),
  }));
}

function buildTelemetrySeries(
  htRows: Record<string, unknown>[],
  txRows: Record<string, unknown>[],
  ltRows: Record<string, unknown>[],
  apfcRows: Record<string, unknown>[],
): TelemetrySeries {
  const ts = (r: Record<string, unknown>) => (r.ts ?? r.bucket) as string;
  const feederSeries: Record<string, [string, number][]> = {};
  for (const r of ltRows) {
    const key = (r.feeder_id ?? r.feeder_code ?? 'f1') as string;
    if (!feederSeries[key]) feederSeries[key] = [];
    feederSeries[key].push([ts(r), (r.kw ?? 0) as number]);
  }
  const fk = Object.keys(feederSeries);
  return {
    htKw:     htRows.map(r => [ts(r), (r.avg_kw ?? r.kw ?? 0) as number] as [string, number]),
    htV:      htRows.map(r => [ts(r), (r.avg_voltage_v ?? 0) as number] as [string, number]),
    htPf:     htRows.map(r => [ts(r), (r.avg_pf ?? r.power_factor ?? 0) as number] as [string, number]),
    oilT:     txRows.map(r => [ts(r), (r.avg_oil_temp_c ?? r.oil_temp_c ?? 0) as number] as [string, number]),
    windT:    txRows.map(r => [ts(r), (r.avg_winding_temp_c ?? r.winding_temp_c ?? 0) as number] as [string, number]),
    oltc:     txRows.map(r => [ts(r), (r.oltc_position ?? 0) as number] as [string, number]),
    f1Kw:     feederSeries[fk[0]] ?? [],
    f2Kw:     feederSeries[fk[1]] ?? [],
    f3Kw:     feederSeries[fk[2]] ?? [],
    f4Kw:     feederSeries[fk[3]] ?? [],
    pfRaw:    apfcRows.map(r => [ts(r), (r.power_factor ?? 0) as number] as [string, number]),
    pfCorr:   apfcRows.map(r => [ts(r), (r.corrected_pf ?? 0) as number] as [string, number]),
    reqKvar:  apfcRows.map(r => [ts(r), (r.required_kvar ?? 0) as number] as [string, number]),
    connKvar: apfcRows.map(r => [ts(r), (r.connected_kvar ?? 0) as number] as [string, number]),
  };
}

// ── Component transformer ─────────────────────────────────────────────────────

function transformComponent(c: Record<string, unknown>) {
  const t = c.component_type as string;

  if (t === 'HT_VCB') return {
    type: 'HT_VCB', id: c.component_identifier as string, label: 'HT Breaker (VCB)',
    status: c.tripped ? 'critical' : 'normal',
    tripped: !!c.tripped, spring: c.spring_charge_ready !== false, relay: c.relay_ok !== false,
  };
  if (t === 'HT_Feeder') return {
    type: 'HT_Feeder', id: c.component_identifier as string, label: 'HT Metering (EN6400)',
    status: 'normal',
    v: c.voltage_v as number, a: c.current_a as number, hz: c.frequency_hz as number,
    pf: c.power_factor as number, kw: c.kw as number, kvar: c.kvar as number, kwh: c.kwh as number,
  };
  if (t === 'TRANSFORMER') return {
    type: 'TRANSFORMER', id: c.component_identifier as string, label: 'Main Transformer',
    status: (c.buchholz_alarm || c.prv_tripped) ? 'critical' : (c.oil_temp_c as number) > 75 ? 'warning' : 'normal',
    oilT: c.oil_temp_c as number, windT: c.winding_temp_c as number,
    mog: c.mog_ok !== false, buch: !!c.buchholz_alarm, prv: !!c.prv_tripped, oltc: c.oltc_position as number,
  };
  if (t === 'LT_ACB') return {
    type: 'LT_ACB', id: c.component_identifier as string, label: 'LT Main Breaker (ACB)',
    status: c.tripped ? 'critical' : 'normal',
    tripped: !!c.tripped, spring: c.spring_charge_ready !== false, relay: true,
  };
  if (t === 'LT_FEEDER') return {
    type: 'LT_FEEDER', id: c.component_identifier as string, label: 'LT Bus (415V)',
    status: c.tripped ? 'critical' : 'normal',
    v: c.voltage_v as number, a: c.current_a as number, pf: c.power_factor as number,
    kw: c.kw as number, kvar: c.kvar as number,
  };
  if (t === 'LT_outgoing') return {
    type: 'LT_outgoing', id: c.component_identifier as string,
    label: (c.display_name ?? c.load_description ?? c.component_identifier) as string,
    feeder_id: c.feeder_id as string,
    status: c.tripped ? 'critical' : 'normal',
    kw: c.kw as number, kwh: c.kwh as number,
  };
  if (t === 'APFC') return {
    type: 'APFC', id: c.component_identifier as string, label: 'Power Factor Correction',
    status: 'normal',
    pf: c.power_factor as number, reqKvar: c.required_kvar as number,
    connKvar: c.connected_kvar as number, targetPf: c.target_pf as number, corrPf: c.corrected_pf as number,
  };
  return { type: t, id: c.component_identifier as string, label: t, status: 'normal' };
}

export interface PssDetail {
  id:         string;
  code:       string;
  kva:        number;
  ht:         string;
  loc:        string;
  locCode:    string;
  status:     string;
  seen:       string | null;
  components: ReturnType<typeof transformComponent>[];
  faults:     {
    id: string; ts: string; at: string; sev: string;
    comp: string; type: string; msg: string; fStatus: string;
  }[];
}

export async function getPssDetail(id: string): Promise<PssDetail> {
  const data = await apiFetch<Record<string, unknown>>(`/pss/${id}`);
  const pss  = (data.pss ?? data) as Record<string, unknown>;
  return {
    id:      pss.id as string,
    code:    pss.unique_code as string,
    kva:     pss.kva_rating as number,
    ht:      pss.ht_voltage_class as string,
    loc:     pss.location_name as string,
    locCode: pss.location_code as string,
    status:  (data.status ?? pss.status) as string,
    seen:    (data.last_seen_at ?? null) as string | null,
    components: ((data.components ?? []) as Record<string, unknown>[]).map(transformComponent),
    faults:  ((data.active_faults ?? []) as Record<string, unknown>[]).map(f => ({
      id:      f.id as string,
      ts:      f.ts as string,
      at:      f.ts as string,
      sev:     f.severity as string,
      comp:    (f.component_name ?? f.component_type) as string,
      type:    f.fault_type as string,
      msg:     (f.description ?? f.summary) as string,
      fStatus: f.status as string,
    })),
  };
}

// ── API surface ──────────────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: ThresholdValues = {
  oilTempWarn:  75,
  oilTempCrit:  85,
  windTempWarn: 90,
  windTempCrit: 100,
  pfMin:        0.92,
  loadPctWarn:  85,
  loadPctCrit:  95,
};

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(body.error ?? 'Invalid credentials');
  }
  const data = await res.json() as { token?: string; user: AuthUser };
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
  }).catch(() => {});
  setAuthToken(null);
}

export async function getPss(): Promise<Pss[]> {
  const rows = await apiFetch<Record<string, unknown>[]>('/pss');
  return transformPssList(rows);
}

export async function getEvents(pssId: string | null = null, limit = 100): Promise<PssEvent[]> {
  const path = pssId ? `/pss/${pssId}/events?limit=${limit}` : `/events?limit=${limit}`;
  const rows = await apiFetch<Record<string, unknown>[]>(path);
  return transformEvents(rows);
}

export async function getTelemetry(pssId: string, hours = 24): Promise<TelemetrySeries> {
  const to   = new Date().toISOString();
  const from = new Date(Date.now() - hours * 3600_000).toISOString();
  const qs   = `from=${from}&to=${to}`;
  const [htRows, txRows, ltRows, apfcRows] = await Promise.all([
    apiFetch<{ rows: Record<string, unknown>[] }>(`/pss/${pssId}/telemetry?group=ht&${qs}`).then(r => r.rows ?? []),
    apiFetch<{ rows: Record<string, unknown>[] }>(`/pss/${pssId}/telemetry?group=transformer&${qs}`).then(r => r.rows ?? []),
    apiFetch<{ rows: Record<string, unknown>[] }>(`/pss/${pssId}/telemetry?group=lt&${qs}`).then(r => r.rows ?? []),
    apiFetch<{ rows: Record<string, unknown>[] }>(`/pss/${pssId}/telemetry?group=apfc&${qs}`).then(r => r.rows ?? []),
  ]);
  return buildTelemetrySeries(htRows, txRows, ltRows, apfcRows);
}

export async function getUsers(): Promise<User[]> {
  const rows = await apiFetch<Record<string, unknown>[]>('/admin/users');
  return transformUsers(rows);
}

export async function createUser(data: {
  name: string;
  email: string;
  role: User['role'];
  access: string[];
}) {
  const res = await apiFetch<{ user: Record<string, unknown>; temp_password: string }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ full_name: data.name, email: data.email, role: data.role, pss_ids: data.access }),
  });
  return { user: transformUsers([res.user])[0], tempPassword: res.temp_password };
}

export async function updateUser(id: string, data: { name: string; email: string; role: User['role'] }) {
  const res = await apiFetch<Record<string, unknown>>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ full_name: data.name, email: data.email, role: data.role }),
  });
  return transformUsers([res])[0];
}

export async function setUserStatus(id: string, is_active: boolean) {
  return apiFetch(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  });
}

export async function getThresholds(pssId: string): Promise<Thresholds> {
  const data = await apiFetch<Record<string, unknown>>(`/pss/${pssId}/thresholds`);
  const byType = (data.by_type as Record<string, unknown[]>) ?? {};
  const tx     = (byType.TRANSFORMER?.[0] as Record<string, unknown>) ?? null;
  const rules  = ((tx?.rules as Record<string, number>) ?? {});
  return {
    global: {
      oilTempWarn:  rules.oil_warn_c         ?? 75,
      oilTempCrit:  rules.oil_critical_c     ?? 85,
      windTempWarn: rules.winding_warn_c     ?? 90,
      windTempCrit: rules.winding_critical_c ?? 100,
      pfMin:        0.92,
      loadPctWarn:  85,
      loadPctCrit:  95,
    },
    perUnit: {},
  };
}

export async function requestShutoff(pssId: string, reason: string) {
  return apiFetch(`/pss/${pssId}/controls/shutoff`, {
    method: 'POST',
    body: JSON.stringify({ reason, acknowledged: true }),
  });
}
