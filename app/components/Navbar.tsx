'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from './AdminProvider';
import { Lock, Unlock, LayoutDashboard, Trophy, CalendarCheck, Settings } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const DESKTOP_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/games', label: 'Matches' },
  { href: '/results', label: 'Results' },
  { href: '/signups', label: 'Signups' },
  { href: '/settings', label: 'Settings', adminOnly: true },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/results', label: 'Results', icon: Trophy },
  { href: '/signups', label: 'Signups', icon: CalendarCheck },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin, login, logout } = useAdmin();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const visibleDesktopItems = DESKTOP_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const visibleMobileItems = MOBILE_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {/* Top Header for Desktop and Mobile */}
      <nav aria-label="Main Navigation" className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-bold text-lg rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Wallyball League
          </Link>

          <div className="flex items-center space-x-4">
            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center gap-1">
              {visibleDesktopItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                      active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Admin Mode Toggle */}
            <div className="sm:pl-4 sm:border-l sm:border-gray-700">
              <button
                onClick={isAdmin ? logout : login}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                  isAdmin
                    ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80 border border-emerald-800'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-700'
                }`}
              >
                {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="hidden sm:inline">{isAdmin ? 'Admin Mode On' : 'Admin Login'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile App-Style Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {visibleMobileItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-2 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  active
                    ? 'text-blue-400 font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {Icon && <Icon className={`w-5 h-5 mb-1 ${active ? 'text-blue-400' : 'text-gray-400'}`} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
