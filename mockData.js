// Trinity PSS Dashboard — Mock Data
(function () {
  const now = Date.now();
  function mAgo(m) { return new Date(now - m * 60000).toISOString(); }

  function makeSeries(base, variance, pts, hoursBack) {
    const step = (hoursBack * 3600000) / pts;
    return Array.from({ length: pts }, (_, i) => {
      const t = now - hoursBack * 3600000 + i * step;
      const trend = Math.sin(i / pts * Math.PI * 2) * variance * 0.4;
      const noise = (Math.random() - 0.5) * variance;
      return [new Date(t).toISOString(), +Math.max(0, base + trend + noise).toFixed(2)];
    });
  }

  window.MOCK_DATA = {
    user: { id: 'U001', name: 'Rajesh Kumar', email: 'r.kumar@trinity-energy.com', role: 'admin', initials: 'RK' },

    pss: [
      { id: '001', code: 'PSS-2.5MVA-A', kva: 2500, ht: '11kV', loc: 'Hyderabad Hub 1',  status: 'normal',   seen: mAgo(0.05), htKw: 1124, ltKw: 1092, eff: 97.1, oilT: 42.3, pf: 0.98, feeders: 4, faults: 0 },
      { id: '002', code: 'PSS-2.5MVA-B', kva: 2500, ht: '11kV', loc: 'Hyderabad Hub 2',  status: 'warning',  seen: mAgo(0.5),  htKw: 1380, ltKw: 1340, eff: 97.1, oilT: 68.5, pf: 0.93, feeders: 4, faults: 2 },
      { id: '003', code: 'PSS-1.6MVA-C', kva: 1600, ht: '11kV', loc: 'Pune Station 1',   status: 'critical', seen: mAgo(1),    htKw: 1180, ltKw: 1145, eff: 97.0, oilT: 91.2, pf: 0.88, feeders: 3, faults: 1 },
      { id: '004', code: 'PSS-2.5MVA-D', kva: 2500, ht: '11kV', loc: 'Mumbai Central',   status: 'normal',   seen: mAgo(0.1),  htKw:  892, ltKw:  867, eff: 97.2, oilT: 38.7, pf: 0.97, feeders: 4, faults: 0 },
      { id: '005', code: 'PSS-1.6MVA-E', kva: 1600, ht: '11kV', loc: 'Chennai Hub 1',    status: 'offline',  seen: mAgo(18),   htKw:    0, ltKw:    0, eff: 0,    oilT: 32.1, pf: 0,    feeders: 0, faults: 0 },
      { id: '006', code: 'PSS-2.5MVA-F', kva: 2500, ht: '11kV', loc: 'Bengaluru East',   status: 'normal',   seen: mAgo(0.02), htKw: 1580, ltKw: 1535, eff: 97.2, oilT: 45.8, pf: 0.99, feeders: 4, faults: 0 },
      { id: '007', code: 'PSS-1.6MVA-G', kva: 1600, ht: '11kV', loc: 'Delhi NCR Hub',    status: 'warning',  seen: mAgo(2),    htKw: 1120, ltKw: 1086, eff: 97.0, oilT: 71.3, pf: 0.92, feeders: 3, faults: 1 },
    ],

    detail: {
      '001': {
        status: 'normal', seen: mAgo(0.05),
        components: [
          { type: 'HT_VCB',      id: 'HT-VCB-01',  label: 'HT Breaker (VCB)',       status: 'normal',   tripped: false, spring: true,  relay: true },
          { type: 'HT_Feeder',   id: 'EN6400-01',   label: 'HT Metering (EN6400)',   status: 'normal',   v: 11000, a: 85.2,  hz: 50.0, pf: 0.91, kw: 1124, kvar: 510 },
          { type: 'TRANSFORMER', id: 'TRF-01',       label: 'Main Transformer',       status: 'normal',   oilT: 42.3, windT: 58.1, mog: true,  buch: false, prv: false, oltc: 2 },
          { type: 'LT_ACB',      id: 'LT-ACB-01',   label: 'LT Main Breaker (ACB)', status: 'normal',   tripped: false, spring: true,  relay: true },
          { type: 'LT_FEEDER',   id: 'LT-BUS-01',   label: 'LT Bus (415V)',          status: 'normal',   v: 415, a: 1520, pf: 0.98, kw: 1092, kvar: 220 },
          { type: 'LT_outgoing', id: 'F1',           label: 'Feeder 1 — EV Zone A',  status: 'normal',   kw: 285, a: 396 },
          { type: 'LT_outgoing', id: 'F2',           label: 'Feeder 2 — EV Zone B',  status: 'normal',   kw: 312, a: 433 },
          { type: 'LT_outgoing', id: 'F3',           label: 'Feeder 3 — Auxiliary',  status: 'normal',   kw: 245, a: 340 },
          { type: 'LT_outgoing', id: 'F4',           label: 'Feeder 4 — Lighting',   status: 'normal',   kw: 250, a: 347 },
          { type: 'APFC',        id: 'APFC-01',      label: 'Power Factor Correction',status: 'normal',  reqKvar: 380, connKvar: 360, targetPf: 0.99, corrPf: 0.98 },
        ],
        faults: [],
      },
      '002': {
        status: 'warning', seen: mAgo(0.5),
        components: [
          { type: 'HT_VCB',      id: 'HT-VCB-02',  label: 'HT Breaker (VCB)',       status: 'normal',   tripped: false, spring: true,  relay: true },
          { type: 'HT_Feeder',   id: 'EN6400-02',   label: 'HT Metering (EN6400)',   status: 'normal',   v: 11000, a: 104.2, hz: 50.0, pf: 0.91, kw: 1380, kvar: 630 },
          { type: 'TRANSFORMER', id: 'TRF-02',       label: 'Main Transformer',       status: 'warning',  oilT: 68.5, windT: 82.3, mog: true,  buch: false, prv: false, oltc: 1 },
          { type: 'LT_ACB',      id: 'LT-ACB-02',   label: 'LT Main Breaker (ACB)', status: 'normal',   tripped: false, spring: true,  relay: true },
          { type: 'LT_FEEDER',   id: 'LT-BUS-02',   label: 'LT Bus (415V)',          status: 'normal',   v: 412, a: 1880, pf: 0.97, kw: 1340, kvar: 350 },
          { type: 'LT_outgoing', id: 'F1',           label: 'Feeder 1 — EV Zone A',  status: 'normal',   kw: 380, a: 528 },
          { type: 'LT_outgoing', id: 'F2',           label: 'Feeder 2 — EV Zone B',  status: 'normal',   kw: 420, a: 584 },
          { type: 'LT_outgoing', id: 'F3',           label: 'Feeder 3 — Auxiliary',  status: 'normal',   kw: 285, a: 396 },
          { type: 'LT_outgoing', id: 'F4',           label: 'Feeder 4 — Lighting',   status: 'warning',  kw: 255, a: 354 },
          { type: 'APFC',        id: 'APFC-02',      label: 'Power Factor Correction',status: 'warning', reqKvar: 520, connKvar: 420, targetPf: 0.99, corrPf: 0.93 },
        ],
        faults: [
          { id: 'F001', sev: 'warning',  comp: 'TRANSFORMER', msg: 'Oil temperature 68.5°C is approaching the warning limit (70°C). Please monitor closely.', at: mAgo(15), fStatus: 'active' },
          { id: 'F002', sev: 'warning',  comp: 'APFC',        msg: 'Power factor 0.93 is below the required target of 0.99. Consider increasing reactive compensation.', at: mAgo(8),  fStatus: 'active' },
        ],
      },
      '003': {
        status: 'critical', seen: mAgo(1),
        components: [
          { type: 'HT_VCB',      id: 'HT-VCB-03',  label: 'HT Breaker (VCB)',       status: 'normal',   tripped: false, spring: true,  relay: true },
          { type: 'HT_Feeder',   id: 'EN6400-03',   label: 'HT Metering (EN6400)',   status: 'normal',   v: 11000, a: 89.4,  hz: 50.0, pf: 0.88, kw: 1180, kvar: 650 },
          { type: 'TRANSFORMER', id: 'TRF-03',       label: 'Main Transformer',       status: 'critical', oilT: 91.2, windT: 108.5, mog: true, buch: true, prv: false, oltc: 3 },
          { type: 'LT_ACB',      id: 'LT-ACB-03',   label: 'LT Main Breaker (ACB)', status: 'normal',   tripped: false, spring: true,  relay: true },
          { type: 'LT_FEEDER',   id: 'LT-BUS-03',   label: 'LT Bus (415V)',          status: 'normal',   v: 415, a: 1600, pf: 0.97, kw: 1145, kvar: 295 },
          { type: 'LT_outgoing', id: 'F1',           label: 'Feeder 1 — EV Zone A',  status: 'normal',   kw: 420, a: 584 },
          { type: 'LT_outgoing', id: 'F2',           label: 'Feeder 2 — EV Zone B',  status: 'normal',   kw: 385, a: 535 },
          { type: 'LT_outgoing', id: 'F3',           label: 'Feeder 3 — Auxiliary',  status: 'normal',   kw: 340, a: 473 },
          { type: 'APFC',        id: 'APFC-03',      label: 'Power Factor Correction',status: 'critical',reqKvar: 480, connKvar: 180, targetPf: 0.99, corrPf: 0.88 },
        ],
        faults: [
          { id: 'F003', sev: 'critical', comp: 'TRANSFORMER', msg: 'Oil temperature 91.2°C has exceeded the critical safety limit (85°C). Immediate on-site inspection required.', at: mAgo(2), fStatus: 'active' },
        ],
      },
      '004': {
        status: 'normal', seen: mAgo(0.1),
        components: [
          { type: 'HT_VCB',      id: 'HT-VCB-04',  label: 'HT Breaker (VCB)',       status: 'normal', tripped: false, spring: true,  relay: true },
          { type: 'HT_Feeder',   id: 'EN6400-04',   label: 'HT Metering (EN6400)',   status: 'normal', v: 11000, a: 67.5,  hz: 50.0, pf: 0.92, kw: 892,  kvar: 390 },
          { type: 'TRANSFORMER', id: 'TRF-04',       label: 'Main Transformer',       status: 'normal', oilT: 38.7, windT: 51.2, mog: true, buch: false, prv: false, oltc: 2 },
          { type: 'LT_ACB',      id: 'LT-ACB-04',   label: 'LT Main Breaker (ACB)', status: 'normal', tripped: false, spring: true,  relay: true },
          { type: 'LT_FEEDER',   id: 'LT-BUS-04',   label: 'LT Bus (415V)',          status: 'normal', v: 415, a: 1210, pf: 0.97, kw: 867, kvar: 188 },
          { type: 'LT_outgoing', id: 'F1',           label: 'Feeder 1 — EV Zone A',  status: 'normal', kw: 245, a: 340 },
          { type: 'LT_outgoing', id: 'F2',           label: 'Feeder 2 — EV Zone B',  status: 'normal', kw: 280, a: 389 },
          { type: 'LT_outgoing', id: 'F3',           label: 'Feeder 3 — Auxiliary',  status: 'normal', kw: 210, a: 292 },
          { type: 'LT_outgoing', id: 'F4',           label: 'Feeder 4 — Lighting',   status: 'normal', kw: 132, a: 183 },
          { type: 'APFC',        id: 'APFC-04',      label: 'Power Factor Correction',status: 'normal', reqKvar: 320, connKvar: 310, targetPf: 0.99, corrPf: 0.97 },
        ],
        faults: [],
      },
      '006': {
        status: 'normal', seen: mAgo(0.02),
        components: [
          { type: 'HT_VCB',      id: 'HT-VCB-06',  label: 'HT Breaker (VCB)',       status: 'normal', tripped: false, spring: true,  relay: true },
          { type: 'HT_Feeder',   id: 'EN6400-06',   label: 'HT Metering (EN6400)',   status: 'normal', v: 11000, a: 119.4, hz: 50.0, pf: 0.93, kw: 1580, kvar: 720 },
          { type: 'TRANSFORMER', id: 'TRF-06',       label: 'Main Transformer',       status: 'normal', oilT: 45.8, windT: 62.4, mog: true, buch: false, prv: false, oltc: 2 },
          { type: 'LT_ACB',      id: 'LT-ACB-06',   label: 'LT Main Breaker (ACB)', status: 'normal', tripped: false, spring: true,  relay: true },
          { type: 'LT_FEEDER',   id: 'LT-BUS-06',   label: 'LT Bus (415V)',          status: 'normal', v: 415, a: 2135, pf: 0.99, kw: 1535, kvar: 130 },
          { type: 'LT_outgoing', id: 'F1',           label: 'Feeder 1 — EV Zone A',  status: 'normal', kw: 425, a: 591 },
          { type: 'LT_outgoing', id: 'F2',           label: 'Feeder 2 — EV Zone B',  status: 'normal', kw: 480, a: 667 },
          { type: 'LT_outgoing', id: 'F3',           label: 'Feeder 3 — Auxiliary',  status: 'normal', kw: 380, a: 528 },
          { type: 'LT_outgoing', id: 'F4',           label: 'Feeder 4 — Lighting',   status: 'normal', kw: 250, a: 347 },
          { type: 'APFC',        id: 'APFC-06',      label: 'Power Factor Correction',status: 'normal', reqKvar: 580, connKvar: 570, targetPf: 0.99, corrPf: 0.99 },
        ],
        faults: [],
      },
      '007': {
        status: 'warning', seen: mAgo(2),
        components: [
          { type: 'HT_VCB',      id: 'HT-VCB-07',  label: 'HT Breaker (VCB)',       status: 'normal',  tripped: false, spring: true,  relay: true },
          { type: 'HT_Feeder',   id: 'EN6400-07',   label: 'HT Metering (EN6400)',   status: 'normal',  v: 11000, a: 84.7,  hz: 50.0, pf: 0.90, kw: 1120, kvar: 548 },
          { type: 'TRANSFORMER', id: 'TRF-07',       label: 'Main Transformer',       status: 'warning', oilT: 71.3, windT: 86.2, mog: true, buch: false, prv: false, oltc: 1 },
          { type: 'LT_ACB',      id: 'LT-ACB-07',   label: 'LT Main Breaker (ACB)', status: 'normal',  tripped: false, spring: true,  relay: true },
          { type: 'LT_FEEDER',   id: 'LT-BUS-07',   label: 'LT Bus (415V)',          status: 'normal',  v: 413, a: 1512, pf: 0.97, kw: 1086, kvar: 286 },
          { type: 'LT_outgoing', id: 'F1',           label: 'Feeder 1 — EV Zone A',  status: 'normal',  kw: 420, a: 584 },
          { type: 'LT_outgoing', id: 'F2',           label: 'Feeder 2 — EV Zone B',  status: 'normal',  kw: 380, a: 528 },
          { type: 'LT_outgoing', id: 'F3',           label: 'Feeder 3 — Auxiliary',  status: 'normal',  kw: 286, a: 398 },
          { type: 'APFC',        id: 'APFC-07',      label: 'Power Factor Correction',status: 'warning', reqKvar: 460, connKvar: 360, targetPf: 0.99, corrPf: 0.92 },
        ],
        faults: [
          { id: 'F007', sev: 'warning', comp: 'TRANSFORMER', msg: 'Oil temperature 71.3°C has exceeded the warning threshold (70°C). Check cooling system.', at: mAgo(2), fStatus: 'active' },
        ],
      },
    },

    users: [
      { id: 'U001', name: 'Rajesh Kumar',  email: 'r.kumar@trinity-energy.com',  role: 'admin',   active: true,  login: mAgo(30),    access: [] },
      { id: 'U002', name: 'Priya Mehta',   email: 'p.mehta@trinity-energy.com',  role: 'service', active: true,  login: mAgo(120),   access: [] },
      { id: 'U003', name: 'Vikram Singh',  email: 'v.singh@trinity-energy.com',  role: 'service', active: true,  login: mAgo(480),   access: [] },
      { id: 'U004', name: 'Aisha Patel',   email: 'a.patel@trinity-energy.com',  role: 'user',    active: true,  login: mAgo(1440),  access: ['001','002'] },
      { id: 'U005', name: 'Suresh Nair',   email: 's.nair@trinity-energy.com',   role: 'user',    active: false, login: mAgo(10080), access: ['004'] },
    ],

    events: [
      { id: 'E001', ts: mAgo(2),    sev: 'critical', comp: 'TRANSFORMER', type: 'TEMPERATURE_CRITICAL', msg: 'Oil temperature 91.2°C exceeds critical limit (85°C). Immediate action required.',      fStatus: 'active',  pssId: '003', pssCode: 'PSS-1.6MVA-C', detail: { oil_temp_c: 91.2, limit_c: 85.0, winding_temp_c: 108.5 } },
      { id: 'E002', ts: mAgo(8),    sev: 'warning',  comp: 'APFC',        type: 'POWER_FACTOR_LOW',     msg: 'Power factor 0.93 below target 0.99. Insufficient reactive power compensation.',       fStatus: 'active',  pssId: '002', pssCode: 'PSS-2.5MVA-B', detail: { pf: 0.93, target: 0.99, deficit_kvar: 100 } },
      { id: 'E003', ts: mAgo(15),   sev: 'warning',  comp: 'TRANSFORMER', type: 'TEMPERATURE_WARNING',  msg: 'Oil temperature 68.5°C approaching warning limit (70°C). Monitor closely.',            fStatus: 'active',  pssId: '002', pssCode: 'PSS-2.5MVA-B', detail: { oil_temp_c: 68.5, limit_c: 70.0 } },
      { id: 'E004', ts: mAgo(120),  sev: 'warning',  comp: 'HT_Feeder',   type: 'OVERLOAD',             msg: 'HT feeder current 104A near rated capacity (110A). Reduce load to prevent trip.',      fStatus: 'cleared', pssId: '002', pssCode: 'PSS-2.5MVA-B', detail: { current_a: 104, rated_a: 110, pct: 94.5 } },
      { id: 'E005', ts: mAgo(240),  sev: 'info',     comp: 'HT_VCB',      type: 'MANUAL_OPERATION',     msg: 'HT VCB opened manually by operator for scheduled maintenance.',                         fStatus: null,      pssId: '001', pssCode: 'PSS-2.5MVA-A', detail: { operator: 'Vikram Singh', action: 'OPEN' } },
      { id: 'E006', ts: mAgo(262),  sev: 'info',     comp: 'HT_VCB',      type: 'MANUAL_OPERATION',     msg: 'HT VCB closed after maintenance completion. System restored to normal.',                fStatus: null,      pssId: '001', pssCode: 'PSS-2.5MVA-A', detail: { operator: 'Vikram Singh', action: 'CLOSE' } },
      { id: 'E007', ts: mAgo(480),  sev: 'critical', comp: 'LT_ACB',      type: 'TRIP',                 msg: 'LT ACB tripped on overcurrent protection (2,850A vs. rated 2,500A). Manual reset required.', fStatus: 'cleared', pssId: '007', pssCode: 'PSS-1.6MVA-G', detail: { trip_current_a: 2850, rated_a: 2500 } },
      { id: 'E008', ts: mAgo(720),  sev: 'info',     comp: 'TRANSFORMER', type: 'OLTC_STEP',            msg: 'OLTC tap automatically changed from +1 to +2 for voltage regulation.',                  fStatus: null,      pssId: '001', pssCode: 'PSS-2.5MVA-A', detail: { from: 1, to: 2 } },
      { id: 'E009', ts: mAgo(1440), sev: 'warning',  comp: 'LT_outgoing', type: 'FEEDER_OVERLOAD',      msg: 'Feeder F2 load 420kW exceeds 90% of rated capacity (450kW).',                          fStatus: 'cleared', pssId: '002', pssCode: 'PSS-2.5MVA-B', detail: { feeder: 'F2', kw: 420, rated_kw: 450, pct: 93.3 } },
    ],

    telemetry: {
      '001': {
        htKw:        null,  htV: null, htPf: null,
        oilT:        null,  windT: null, oltc: null,
        f1Kw: null, f2Kw: null, f3Kw: null, f4Kw: null,
        pfRaw: null, pfCorr: null, reqKvar: null, connKvar: null,
      }
    },

    makeSeries,
  };

  // Pre-generate telemetry for PSS-001
  const D = window.MOCK_DATA;
  D.telemetry['001'] = {
    htKw:    D.makeSeries(1124, 120, 96, 24),
    htV:     D.makeSeries(11000, 180, 96, 24),
    htPf:    D.makeSeries(0.91, 0.04, 96, 24).map(([t,v]) => [t, Math.min(1, Math.max(0.7, v))]),
    oilT:    D.makeSeries(42.3, 6,   96, 24),
    windT:   D.makeSeries(58.1, 8,   96, 24),
    oltc:    D.makeSeries(2,    1.2, 96, 24).map(([t,v]) => [t, Math.round(v)]),
    f1Kw:    D.makeSeries(285,  40,  96, 24),
    f2Kw:    D.makeSeries(312,  45,  96, 24),
    f3Kw:    D.makeSeries(245,  30,  96, 24),
    f4Kw:    D.makeSeries(250,  25,  96, 24),
    pfRaw:   D.makeSeries(0.82, 0.05, 96, 24).map(([t,v]) => [t, Math.min(1, Math.max(0.65, v))]),
    pfCorr:  D.makeSeries(0.98, 0.01, 96, 24).map(([t,v]) => [t, Math.min(1, Math.max(0.85, v))]),
    reqKvar: D.makeSeries(380,  50,  96, 24),
    connKvar:D.makeSeries(360,  50,  96, 24),
  };
})();
