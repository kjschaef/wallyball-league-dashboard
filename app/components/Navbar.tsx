'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Wallyball League
        </Link>

        <div className="flex space-x-1">
          <Link 
            href="/dashboard" 
            className={`px-3 py-2 rounded ${isActive('/dashboard') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
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
      </div>
    </nav>
  );
}
