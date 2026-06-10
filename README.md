# Trinity PSS Dashboard — Frontend

Static multi-file React frontend (Babel in-browser) + ECharts. No build step required.

---

## Running locally

Open `frontend/index.html` in a browser.  
By default runs on **mock data** — no backend needed.

---

## Connecting to your backend

### Step 1 — Point at your API

Add two meta tags to `index.html` (inside `<head>`):

```html
<meta name="api-base" content="https://your-backend.com/api">
<meta name="ws-base"  content="wss://your-backend.com/ws">
```

Or set globals before the scripts load:

```html
<script>
  window.API_BASE = 'https://your-backend.com/api';
  window.WS_BASE  = 'wss://your-backend.com/ws';
</script>
```

### Step 2 — Enable live mode

In `App.jsx`, flip this flag near the top:

```js
const USE_LIVE_API = true;   // was false
```

That's it. The app will:
- Call `POST /api/auth/login` on sign-in
- Fetch `/api/pss`, `/api/events`, `/api/thresholds` on load
- Connect a WebSocket for live telemetry
- Push threshold saves back to `PUT /api/thresholds`
- Fall back to the mock simulation interval when `USE_LIVE_API = false`

---

## API Contract

### Authentication

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/api/auth/logout` | — | `200` |

**User object:**
```json
{ "id": "U001", "name": "Rajesh Kumar", "email": "r.kumar@...",
  "role": "admin", "initials": "RK" }
```

Token is stored in `localStorage` as `trinity_token` and sent as `Authorization: Bearer <token>`.

---

### PSS Units

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/pss` | `PSS[]` |
| GET | `/api/pss/:id` | `{ status, seen, components[], faults[] }` |

**PSS object:**
```json
{
  "id": "001", "code": "PSS-2.5MVA-A", "kva": 2500, "ht": "11kV",
  "loc": "Hyderabad Hub 1",
  "status": "normal",
  "seen": "2026-06-10T10:00:00.000Z",
  "htKw": 1124, "ltKw": 1092, "eff": 97.1,
  "oilT": 42.3, "pf": 0.98, "feeders": 4, "faults": 0
}
```

`status` enum: `normal` | `warning` | `critical` | `offline`

---

### Events

| Method | Path | Query params | Response |
|--------|------|-------------|----------|
| GET | `/api/events` | `pssId?`, `limit?` | `Event[]` |

**Event object:**
```json
{
  "id": "E001",
  "ts": "2026-06-10T09:58:00.000Z",
  "sev": "critical",
  "comp": "TRANSFORMER",
  "type": "TEMPERATURE_CRITICAL",
  "msg": "Oil temperature 91.2°C exceeds critical limit (85°C).",
  "fStatus": "active",
  "pssId": "003",
  "pssCode": "PSS-1.6MVA-C",
  "detail": { "oil_temp_c": 91.2, "limit_c": 85.0 }
}
```

`sev` enum: `critical` | `warning` | `info`  
`fStatus` enum: `active` | `cleared` | `null`

---

### Telemetry

| Method | Path | Query params | Response |
|--------|------|-------------|----------|
| GET | `/api/telemetry/:pssId` | `hours?` (default 24) | Time-series object |

**Response shape** — each key is `[[isoTimestamp, value], ...]`:
```json
{
  "htKw":    [["2026-06-09T10:00:00Z", 1124], ...],
  "htV":     [...],
  "htPf":    [...],
  "oilT":    [...],
  "windT":   [...],
  "oltc":    [...],
  "f1Kw":    [...],
  "f2Kw":    [...],
  "f3Kw":    [...],
  "f4Kw":    [...],
  "pfRaw":   [...],
  "pfCorr":  [...],
  "reqKvar": [...],
  "connKvar":[...]
}
```

---

### Users *(admin only)*

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/users` | — | `User[]` |
| POST | `/api/users` | `UserInput` | `{ user, tempPassword }` |
| PUT | `/api/users/:id` | `Partial<UserInput>` | `User` |

**UserInput:**
```json
{ "name": "Priya Mehta", "email": "p.mehta@...",
  "role": "service", "active": true, "access": [] }
```

`role` enum: `admin` | `service` | `user`  
`access`: array of PSS IDs (only used when `role === "user"`)

---

### Thresholds

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/thresholds` | — | ThresholdConfig |
| PUT | `/api/thresholds` | ThresholdConfig | ThresholdConfig |

**ThresholdConfig:**
```json
{
  "global": {
    "oilTempWarn": 70, "oilTempCrit": 85,
    "windTempWarn": 85, "windTempCrit": 100,
    "pfMin": 0.92,
    "loadPctWarn": 85, "loadPctCrit": 95
  },
  "perUnit": {
    "003": { "oilTempWarn": 65, "oilTempCrit": 80 }
  }
}
```

---

### WebSocket

Connect to `ws://<WS_BASE>/pss?token=<jwt>`

**Server → Client messages:**

| `type` | `data` | When |
|--------|--------|------|
| `PSS_UPDATE` | `PSS[]` | Full snapshot on connect + periodic |
| `PSS_PATCH` | `{ id, ...fields }` | Single-unit partial update |
| `NEW_EVENT` | `Event` | New fault or threshold breach |

**Client → Server (optional):**

| `type` | Payload | Purpose |
|--------|---------|---------|
| `ACK_EVENT` | `{ id }` | Acknowledge an active fault |

---

## File structure

| File | Purpose |
|------|---------|
| `index.html` | Entry point — global CSS, CDN scripts, load order |
| `api.js` | REST + WebSocket service layer |
| `mockData.js` | Development fixture data (used when `USE_LIVE_API = false`) |
| `UIComponents.jsx` | BRAND tokens, icons, badges, chart wrapper, shared primitives |
| `Layout.jsx` | Sidebar + Topbar shell |
| `Login.jsx` | Login screen |
| `Overview.jsx` | Fleet overview — KPI strip + swappable live charts + unit table |
| `Sld.jsx` | Single-line diagram SVG renderer |
| `PssDetail.jsx` | 3-column PSS detail — SLD + component list + faults |
| `Graphs.jsx` | Telemetry chart pages |
| `Events.jsx` | Fault / event log table with filters |
| `AdminUsers.jsx` | User management (admin role only) |
| `Notifications.jsx` | Bell dropdown + toast pop-ups |
| `Config.jsx` | Threshold configuration — global + per-unit |
| `App.jsx` | Root component — routing, state, sim/WS, notifications |
