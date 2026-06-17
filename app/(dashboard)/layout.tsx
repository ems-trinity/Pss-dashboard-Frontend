'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import type { Notification } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [collapsed,     setCollapsed]     = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // wsStatus and setWsStatus are wired up by Task 13 (WebSocket hook)
  const [wsStatus,      setWsStatus]      = useState<'live' | 'reconnecting'>('live');

  const unreadCount = notifications.filter(n => !n.read).length;

  // addNotification is called by Task 13 (WebSocket hook) added directly in this file
  const addNotification = useCallback((n: Omit<Notification, 'id' | 'at' | 'read'>) => {
    const id = 'N' + Date.now();
    setNotifications(prev => [
      { ...n, id, at: new Date().toISOString(), read: false },
      ...prev,
    ].slice(0, 40));
  }, []);

  useWebSocket({
    locationCode:   null,
    onNewEvent:     addNotification,
    onStatusChange: setWsStatus,
  });

  void notifOpen;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-sm text-[#6B7280]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          wsStatus={wsStatus}
          unreadCount={unreadCount}
          onNotifToggle={() => setNotifOpen(v => !v)}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
