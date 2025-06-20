'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, BarChart3, Calendar, Home, Users } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/games', label: 'Games', icon: Calendar },
    { href: '/results', label: 'Results', icon: Trophy },
    { href: '/players', label: 'Players', icon: Users },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cfa-red-600 to-cfa-red-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 group-hover:text-cfa-red-600 transition-colors duration-200">
                Volleyball League
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Performance Tracker
              </span>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-cfa-red-50 text-cfa-red-700 shadow-sm'
                      : 'text-gray-600 hover:text-cfa-red-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 rounded-lg text-gray-600 hover:text-cfa-red-600 hover:bg-gray-50 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Hidden by default, would need state management for toggle */}
        <div className="md:hidden border-t border-gray-200 py-3">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-cfa-red-50 text-cfa-red-700'
                      : 'text-gray-600 hover:text-cfa-red-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}