export type PssStatus = 'normal' | 'warning' | 'critical' | 'offline';

export interface Pss {
  id:      string;
  code:    string;
  kva:     number;
  ht:      string;
  loc:     string;
  locCode: string;
  status:  PssStatus;
  seen:    string | null;
  htKw:    number;
  ltKw:    number;
  eff:     number;
  oilT:    number;
  pf:      number;
  feeders: number;
  faults:  number;
}

export interface PssEvent {
  id:      string;
  ts:      string;
  sev:     'info' | 'warning' | 'critical';
  comp:    string;
  type:    string;
  msg:     string;
  fStatus: string | null;
  pssId:   string;
  pssCode: string | null;
  detail:  Record<string, unknown>;
}

export interface User {
  id:     string;
  name:   string;
  email:  string;
  role:   'super_admin' | 'admin' | 'service' | 'user';
  active: boolean;
  login:  string | null;
  access: string[];
}

export interface Notification {
  id:      string;
  pssId:   string;
  pssCode: string;
  sev:     'warning' | 'critical';
  msg:     string;
  at:      string;
  read:    boolean;
}

export interface ThresholdValues {
  oilTempWarn:  number;
  oilTempCrit:  number;
  windTempWarn: number;
  windTempCrit: number;
  pfMin:        number;
  loadPctWarn:  number;
  loadPctCrit:  number;
}

export interface Thresholds {
  global:  ThresholdValues;
  perUnit: Record<string, Partial<ThresholdValues>>;
}

export interface TelemetrySeries {
  htKw:     [string, number][];
  htV:      [string, number][];
  htPf:     [string, number][];
  oilT:     [string, number][];
  windT:    [string, number][];
  oltc:     [string, number][];
  f1Kw:     [string, number][];
  f2Kw:     [string, number][];
  f3Kw:     [string, number][];
  f4Kw:     [string, number][];
  pfRaw:    [string, number][];
  pfCorr:   [string, number][];
  reqKvar:  [string, number][];
  connKvar: [string, number][];
}

export interface AuthUser {
  id:       string;
  name:     string;
  email:    string;
  role:     User['role'];
  initials: string;
}
