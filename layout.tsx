import { Metadata } from 'next';
import { Navbar } from './components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Volleyball League Management',
  description: 'Track and analyze volleyball player and team performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}