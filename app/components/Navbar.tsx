import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-slate-800 text-white p-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <Link href="/" className="text-xl font-bold mb-2 sm:mb-0">
          Volleyball League Manager
        </Link>
        <div className="flex space-x-4">
          <Link href="/" className="hover:text-blue-300">
            Dashboard
          </Link>
          <Link href="/players" className="hover:text-blue-300">
            Players
          </Link>
          <Link href="/results" className="hover:text-blue-300">
            Results
          </Link>
          <Link href="/analytics" className="hover:text-blue-300">
            Analytics
          </Link>
        </div>
      </div>
    </nav>
  );
}