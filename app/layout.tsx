import { Metadata } from 'next';
import { Navbar } from './components/Navbar';
import { Providers } from './components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CFA Wallyball League',
  description: 'Track and analyze volleyball player and team performance',
  icons: {
    icon: '🏐',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}