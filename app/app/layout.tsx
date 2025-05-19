import { Metadata } from 'next';

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
      <body>
        {children}
      </body>
    </html>
  );
}