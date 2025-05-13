import React from 'react';
import './globals.css';
import { Navigation } from './components/Navigation';

export const metadata = {
  title: 'Wallyball League Dashboard',
  description: 'Track, analyze, and visualize player and team performance in wallyball matches',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
