'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from './AdminProvider';
import { Lock, Unlock } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { isAdmin, login, logout } = useAdmin();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Wallyball League
        </Link>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded ${isActive('/') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/results" 
              className={`px-3 py-2 rounded ${isActive('/results') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              Results
            </Link>
            <Link 
              href="/signups" 
              className={`px-3 py-2 rounded ${isActive('/signups') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              Signups
            </Link>
            <Link 
              href="/settings" 
              className={`px-3 py-2 rounded ${isActive('/settings') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              Settings
            </Link>
          </div>
          
          <div className="pl-4 border-l border-gray-700">
            <button
              onClick={isAdmin ? logout : login}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isAdmin 
                  ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80 border border-emerald-800' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-700'
              }`}
            >
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isAdmin ? 'Admin Mode On' : 'Admin Login'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
