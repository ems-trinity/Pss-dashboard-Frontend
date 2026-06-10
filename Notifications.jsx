// Notifications.jsx — Bell button, dropdown panel, toast container
const { useState, useEffect, useRef } = React;

// ── NotificationBell ──────────────────────────────────────────────────────────
function NotificationBell({ notifications, onOpen, isOpen }) {
  const unread      = notifications.filter(n => !n.read).length;
  const hasCritical = notifications.some(n => !n.read && n.sev === 'critical');

  return (
    <button
      onClick={onOpen}
      title="Notifications"
      style={{
        position: 'relative',
        background: isOpen ? '#F1F5F9' : 'transparent',
        border: `1px solid ${BRAND.border}`,
        borderRadius: 8,
        padding: '6px 9px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: BRAND.textSec,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <Ic name="bell" size={15} color={unread > 0 ? BRAND.blue : BRAND.textSec} />
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: -5, right: -5,
          minWidth: 16, height: 16, borderRadius: 99,
          padding: '0 4px',
          background: hasCritical ? '#DC2626' : '#D97706',
          color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #fff',
          lineHeight: 1,
          pointerEvents: 'none',
        }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

// ── NotificationDropdown ──────────────────────────────────────────────────────
function NotificationDropdown({ notifications, onMarkRead, onMarkAll, onClose, onNav }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div ref={ref} className="card" style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
      width: 364, maxHeight: 460,
      boxShadow: '0 8px 32px rgba(15,23,42,0.14)',
      zIndex: 600,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.15s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '13px 16px',
        borderBottom: `1px solid ${BRAND.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: BRAND.text }}>Notifications</span>
          {unread > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: BRAND.blue,
              background: '#EFF6FF', borderRadius: 99, padding: '1px 8px',
            }}>
              {unread} unread
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={onMarkAll} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: BRAND.blue, fontWeight: 500, fontFamily: 'inherit',
          }}>
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <EmptyState icon="bell" title="All clear" sub="Threshold alerts will appear here" color={BRAND.textMut} />
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                onMarkRead(n.id);
                if (n.pssId) { onNav('detail', n.pssId); onClose(); }
              }}
              style={{
                padding: '11px 16px',
                borderBottom: `1px solid #F8FAFC`,
                background: n.read ? 'transparent' : (n.sev === 'critical' ? '#FFF5F5' : '#FFFBEB'),
                cursor: n.pssId ? 'pointer' : 'default',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                transition: 'background 0.1s',
              }}
            >
              {/* Severity icon */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: n.sev === 'critical' ? '#FEE2E2' : n.sev === 'warning' ? '#FEF3C7' : '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 1,
              }}>
                <Ic
                  name={n.sev === 'critical' ? 'alertCirc' : n.sev === 'warning' ? 'alert' : 'info'}
                  size={13}
                  color={n.sev === 'critical' ? '#DC2626' : n.sev === 'warning' ? '#D97706' : BRAND.blue}
                />
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                  {n.pssCode && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: BRAND.blue,
                      background: '#EFF6FF', borderRadius: 4, padding: '1px 6px',
                    }}>
                      {n.pssCode}
                    </span>
                  )}
                  {!n.read && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: n.sev === 'critical' ? '#DC2626' : '#D97706',
                      display: 'inline-block',
                    }} />
                  )}
                </div>
                <div style={{ fontSize: 12, color: BRAND.text, lineHeight: 1.45, textWrap: 'pretty' }}>
                  {n.msg}
                </div>
                <div style={{ fontSize: 10, color: BRAND.textMut, marginTop: 4 }}>
                  {fmt.timeAgo(n.at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── ToastContainer ────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column-reverse', gap: 8,
      zIndex: 2000, pointerEvents: 'none',
      maxWidth: 340,
    }}>
      {toasts.map(t => (
        <div key={t.toastId} style={{
          pointerEvents: 'all',
          background: '#1E293B',
          borderLeft: `4px solid ${t.sev === 'critical' ? '#DC2626' : '#D97706'}`,
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
          animation: 'fadeIn 0.25s ease',
        }}>
          {/* Icon */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: t.sev === 'critical' ? 'rgba(220,38,38,0.18)' : 'rgba(217,119,6,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ic
              name={t.sev === 'critical' ? 'alertCirc' : 'alert'}
              size={13}
              color={t.sev === 'critical' ? '#FCA5A5' : '#FCD34D'}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, marginBottom: 3,
              color: t.sev === 'critical' ? '#FCA5A5' : '#FCD34D',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {t.sev === 'critical' ? 'Critical Alert' : 'Warning'}{t.pssCode ? ` — ${t.pssCode}` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>
              {t.msg}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => onDismiss(t.toastId)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
          >
            <Ic name="x" size={13} color="#64748B" />
          </button>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { NotificationBell, NotificationDropdown, ToastContainer });
