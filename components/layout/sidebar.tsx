'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart2, FileText, Users, Building2,
  FolderOpen, Zap, UserCheck, Shield, Network, Ticket,
  ClipboardList, Settings, ChevronLeft, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types';

const NAV = [
  { href: '/',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/analytics',     label: 'Analytics',     icon: BarChart2 },
  { href: '/reports',       label: 'Reports',       icon: FileText },
  { href: '/customers',     label: 'Customers',     icon: Users },
  { href: '/organisations', label: 'Organisations', icon: Building2 },
  { href: '/projects',      label: 'Locations',      icon: FolderOpen },
  { href: '/pss',           label: 'Sub Stations',  icon: Zap },
  { href: '/team',          label: 'My Team',       icon: UserCheck },
  { href: '/groups',        label: 'Groups',        icon: Shield },
  { href: '/users',         label: 'Users',         icon: Network },
  { href: '/event-logs',    label: 'Event Logs',    icon: Bell },
  { href: '/tickets',       label: 'Tickets',       icon: Ticket },
  { href: '/audit-log',     label: 'Audit Log',     icon: ClipboardList },
  { href: '/settings',      label: 'Settings',      icon: Settings },
];

interface Props {
  collapsed: boolean;
  onToggle:  () => void;
  user:      AuthUser | null;
}

export function Sidebar({ collapsed, onToggle, user }: Props) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white border-r border-[#E5E7EB] transition-all duration-200 flex-shrink-0',
      collapsed ? 'w-14' : 'w-56',
    )}>
      {/* Logo row */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-[#E5E7EB]">
        {!collapsed && (
          <span className="text-sm font-bold text-[#111827] truncate">Trinity PSS</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-gray-100 text-[#6B7280] ml-auto flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-[#2563EB] font-medium'
                  : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User chip */}
      {user && !collapsed && (
        <div className="px-3 py-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center font-semibold flex-shrink-0">
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#111827] truncate">{user.name}</div>
              <div className="text-xs text-[#6B7280] capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
