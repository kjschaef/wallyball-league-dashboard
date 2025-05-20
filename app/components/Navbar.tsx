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
            href="/games" 
            className={`px-3 py-2 rounded ${isActive('/games') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
          >
            Games
          </Link>
          <Link 
            href="/results" 
            className={`px-3 py-2 rounded ${isActive('/results') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
          >
            Results
          </Link>
          <Link 
            href="/analytics" 
            className={`px-3 py-2 rounded ${isActive('/analytics') ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
          >
            Analytics
          </Link>
        </div>
      </div>
    </nav>
  );
}