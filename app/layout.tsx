import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monster Game',
  description:
    'Explore a playful 3D island with Monster, a friendly yellow monster. A gentle first adventure in counting, shapes and letter sounds.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
