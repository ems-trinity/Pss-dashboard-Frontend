'use client';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/api';

interface Props {
  wsStatus:      'live' | 'reconnecting';
  unreadCount:   number;
  onNotifToggle: () => void;
}

export function Topbar({ wsStatus, unreadCount, onNotifToggle }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <header className="h-14 flex items-center justify-end gap-2 px-4 border-b border-[#E5E7EB] bg-white flex-shrink-0">
      {/* WS status */}
      <div className={`flex items-center gap-1.5 text-xs mr-2 ${wsStatus === 'live' ? 'text-green-600' : 'text-yellow-600'}`}>
        {wsStatus === 'live'
          ? <Wifi className="w-3.5 h-3.5" />
          : <WifiOff className="w-3.5 h-3.5" />
        }
        <span>{wsStatus === 'live' ? 'Live' : 'Reconnecting'}</span>
      </div>

      {/* Notification bell */}
      <button
        onClick={onNotifToggle}
        className="relative p-2 rounded-md hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#6B7280]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-semibold bg-red-500 text-white rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Logout */}
      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#6B7280] gap-1.5 text-xs">
        <LogOut className="w-3.5 h-3.5" />
        Logout
      </Button>
    </header>
  );
}
