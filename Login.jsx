// Login.jsx — async-aware login screen
const { useState } = React;

function Login({ onLogin }) {
  const [email,    setEmail]    = useState('admin@trinity.local');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    try {
      // onLogin(email, password) returns a Promise in both mock and live modes
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: BRAND.bgPage,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.4,
        backgroundImage: `radial-gradient(${BRAND.border} 1px, transparent 1px)`,
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Header band */}
        <div style={{
          background: BRAND.blue, padding: '28px 32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <img src="assets/trinity-logo.png"
            style={{ height: 36, filter: 'brightness(0) invert(1)' }} alt="Trinity" />
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, letterSpacing: '0.05em' }}>
            PSS Monitoring System
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textSec }}>Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your.name@trinity-energy.com"
              autoComplete="username" style={{ fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: BRAND.textSec }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ fontSize: 14, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: BRAND.textSec, display: 'flex', padding: 2,
              }}>
                <Ic name={showPw ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, color: '#DC2626',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Ic name="alertCirc" size={14} color="#DC2626" />
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{
            width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14,
          }}>
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</>
              : 'Sign In'
            }
          </button>

          <p style={{ fontSize: 11, color: BRAND.textMut, textAlign: 'center' }}>
            Demo: any email +{' '}
            <span className="mono" style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>demo</span>
          </p>
        </form>
      </div>
    </div>
  );
}

window.Login = Login;
